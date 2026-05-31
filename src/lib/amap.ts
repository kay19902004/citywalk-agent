import type { GeoContext } from "./types";

const amapBaseUrl = "https://restapi.amap.com/v3";

export type AmapNearbyPlace = {
  name: string;
  type: string;
  address: string;
  distance: number | null;
  location: {
    lat: number;
    lng: number;
  } | null;
};

export type AmapLocationContext = {
  city?: string;
  geo: GeoContext;
  places: AmapNearbyPlace[];
  status: "configured" | "missing-key" | "fallback";
  reason?: string;
};

type AmapResponse<T> = {
  status?: string;
  info?: string;
  infocode?: string;
} & T;

type RegeoResponse = {
  regeocode?: {
    formatted_address?: string;
    addressComponent?: {
      province?: string;
      city?: string | string[];
      district?: string;
      township?: string;
      streetNumber?: {
        street?: string;
        number?: string;
      };
    };
  };
};

type RegeoAddressComponent = NonNullable<NonNullable<RegeoResponse["regeocode"]>["addressComponent"]>;

type AroundResponse = {
  pois?: Array<{
    name?: string;
    type?: string;
    address?: string | string[];
    distance?: string;
    location?: string;
  }>;
};

export async function enrichGeoContextWithAmap(geo: GeoContext): Promise<AmapLocationContext> {
  const key = process.env.AMAP_WEB_SERVICE_KEY;
  if (!key) {
    return { geo, places: [], status: "missing-key", reason: "AMAP_WEB_SERVICE_KEY is not configured" };
  }

  if (typeof geo.lat !== "number" || typeof geo.lng !== "number") {
    return { geo, places: [], status: "configured", reason: "GPS coordinates are not available" };
  }

  const location = `${geo.lng},${geo.lat}`;
  const [regeo, around] = await Promise.allSettled([
    requestAmap<RegeoResponse>("/geocode/regeo", {
      key,
      location,
      extensions: "base",
      radius: "600",
      roadlevel: "0"
    }),
    requestAmap<AroundResponse>("/place/around", {
      key,
      location,
      radius: "800",
      offset: "8",
      page: "1",
      extensions: "base",
      sortrule: "distance"
    })
  ]);

  const regeoPayload = regeo.status === "fulfilled" ? regeo.value : null;
  const aroundPayload = around.status === "fulfilled" ? around.value : null;
  const places = normalizePlaces(aroundPayload?.pois ?? []);
  const firstPlace = places[0];
  const address = regeoPayload?.regeocode?.formatted_address;
  const city = deriveCity(regeoPayload?.regeocode?.addressComponent);
  const street = regeoPayload?.regeocode?.addressComponent?.streetNumber?.street;

  const nextGeo: GeoContext = {
    ...geo,
    landmarkName: geo.landmarkName || firstPlace?.name || street || address,
    placeType: geo.placeType || simplifyPlaceType(firstPlace?.type),
    nearbyDetails: geo.nearbyDetails || describeNearbyPlaces(address, places)
  };

  if (!regeoPayload && !aroundPayload) {
    return { city, geo: nextGeo, places, status: "fallback", reason: "AMap requests failed" };
  }

  return { city, geo: nextGeo, places, status: "configured" };
}

async function requestAmap<T>(path: string, params: Record<string, string>): Promise<AmapResponse<T>> {
  const url = new URL(`${amapBaseUrl}${path}`);
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`AMap request failed: ${response.status}`);
  }

  const payload = await response.json() as AmapResponse<T>;
  if (payload.status && payload.status !== "1") {
    throw new Error(`AMap rejected request: ${payload.info ?? payload.infocode ?? "unknown"}`);
  }

  return payload;
}

function normalizePlaces(pois: AroundResponse["pois"]): AmapNearbyPlace[] {
  return (pois ?? []).map((poi) => {
    const location = parseLocation(poi.location);
    return {
      name: poi.name ?? "附近地点",
      type: poi.type ?? "公共地点",
      address: Array.isArray(poi.address) ? poi.address.join("") : poi.address ?? "",
      distance: poi.distance ? Number.parseInt(poi.distance, 10) : null,
      location
    };
  }).filter((place) => place.name.trim().length > 0);
}

function parseLocation(value?: string): AmapNearbyPlace["location"] {
  if (!value) return null;
  const [lng, lat] = value.split(",").map((part) => Number.parseFloat(part));
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  return { lat, lng };
}

function simplifyPlaceType(type?: string): string | undefined {
  if (!type) return undefined;
  return type.split(";").filter(Boolean).slice(0, 3).join(" / ") || undefined;
}

function deriveCity(component?: RegeoAddressComponent): string | undefined {
  if (!component) return undefined;
  const city = Array.isArray(component.city) ? component.city[0] : component.city;
  const value = city || component.province || component.district;
  return value?.replace(/市$/, "") || undefined;
}

function describeNearbyPlaces(address: string | undefined, places: AmapNearbyPlace[]): string | undefined {
  const placeNames = places.slice(0, 4).map((place) => place.name).filter(Boolean);
  if (!address && placeNames.length === 0) return undefined;
  const parts = [];
  if (address) parts.push(`当前位置约在${address}`);
  if (placeNames.length) parts.push(`附近有${placeNames.join("、")}`);
  return parts.join("，");
}
