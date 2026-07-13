'use client';

import { useState } from 'react';
import {
  ComposableMap,
  Geographies,
  Geography,
  ZoomableGroup,
} from 'react-simple-maps';

// Natural Earth 110m world topojson (public domain, hosted by react-simple-maps)
const GEO_URL =
  'https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json';

// ISO-3166 alpha-2 → ISO-3166 numeric mapping (subset of commonly needed ones)
// react-simple-maps uses numeric codes in the topojson
const ALPHA2_TO_NUMERIC: Record<string, string> = {
  AF: '004', AL: '008', DZ: '012', AD: '020', AO: '024', AG: '028', AR: '032',
  AM: '051', AU: '036', AT: '040', AZ: '031', BS: '044', BH: '048', BD: '050',
  BB: '052', BY: '112', BE: '056', BZ: '084', BJ: '204', BT: '064', BO: '068',
  BA: '070', BW: '072', BR: '076', BN: '096', BG: '100', BF: '854', BI: '108',
  CV: '132', KH: '116', CM: '120', CA: '124', CF: '140', TD: '148', CL: '152',
  CN: '156', CO: '170', KM: '174', CG: '178', CD: '180', CR: '188', HR: '191',
  CU: '192', CY: '196', CZ: '203', DK: '208', DJ: '262', DM: '212', DO: '214',
  EC: '218', EG: '818', SV: '222', GQ: '226', ER: '232', EE: '233', SZ: '748',
  ET: '231', FJ: '242', FI: '246', FR: '250', GA: '266', GM: '270', GE: '268',
  DE: '276', GH: '288', GR: '300', GD: '308', GT: '320', GN: '324', GW: '624',
  GY: '328', HT: '332', HN: '340', HU: '348', IS: '352', IN: '356', ID: '360',
  IR: '364', IQ: '368', IE: '372', IL: '376', IT: '380', JM: '388', JP: '392',
  JO: '400', KZ: '398', KE: '404', KI: '296', KW: '414', KG: '417', LA: '418',
  LV: '428', LB: '422', LS: '426', LR: '430', LY: '434', LI: '438', LT: '440',
  LU: '442', MG: '450', MW: '454', MY: '458', MV: '462', ML: '466', MT: '470',
  MH: '584', MR: '478', MU: '480', MX: '484', FM: '583', MD: '498', MC: '492',
  MN: '496', ME: '499', MA: '504', MZ: '508', MM: '104', NA: '516', NR: '520',
  NP: '524', NL: '528', NZ: '554', NI: '558', NE: '562', NG: '566', MK: '807',
  NO: '578', OM: '512', PK: '586', PW: '585', PA: '591', PG: '598', PY: '600',
  PE: '604', PH: '608', PL: '616', PT: '620', QA: '634', RO: '642', RU: '643',
  RW: '646', KN: '659', LC: '662', VC: '670', WS: '882', SM: '674', ST: '678',
  SA: '682', SN: '686', RS: '688', SC: '690', SL: '694', SG: '702', SK: '703',
  SI: '705', SB: '090', SO: '706', ZA: '710', SS: '728', ES: '724', LK: '144',
  SD: '729', SR: '740', SE: '752', CH: '756', SY: '760', TW: '158', TJ: '762',
  TZ: '834', TH: '764', TL: '626', TG: '768', TO: '776', TT: '780', TN: '788',
  TR: '792', TM: '795', TV: '798', UG: '800', UA: '804', AE: '784', GB: '826',
  US: '840', UY: '858', UZ: '860', VU: '548', VE: '862', VN: '704', YE: '887',
  ZM: '894', ZW: '716',
};

interface CountryData {
  countryCode: string; // ISO alpha-2
  count: number;
}

interface Props {
  data: CountryData[];
}

// Map from numeric code → { alpha2, count }
function buildLookup(data: CountryData[]) {
  const map: Record<string, { alpha2: string; count: number }> = {};
  for (const d of data) {
    const numeric = ALPHA2_TO_NUMERIC[d.countryCode.toUpperCase()];
    if (numeric) map[numeric] = { alpha2: d.countryCode, count: d.count };
  }
  return map;
}

const COUNTRY_NAMES: Record<string, string> = {
  IN: 'India', US: 'United States', GB: 'United Kingdom', CA: 'Canada',
  AU: 'Australia', DE: 'Germany', FR: 'France', JP: 'Japan', BR: 'Brazil',
  CN: 'China', RU: 'Russia', KR: 'South Korea', MX: 'Mexico', IT: 'Italy',
  ES: 'Spain', NL: 'Netherlands', SE: 'Sweden', NO: 'Norway', CH: 'Switzerland',
  SG: 'Singapore', AE: 'UAE', PK: 'Pakistan', BD: 'Bangladesh', NP: 'Nepal',
  LK: 'Sri Lanka', ID: 'Indonesia', MY: 'Malaysia', TH: 'Thailand', PH: 'Philippines',
  ZA: 'South Africa', NG: 'Nigeria', KE: 'Kenya', EG: 'Egypt', SA: 'Saudi Arabia',
  NZ: 'New Zealand', AR: 'Argentina', CO: 'Colombia', PL: 'Poland', UA: 'Ukraine',
};

export function WorldMap({ data }: Props) {
  const [tooltip, setTooltip] = useState<{
    x: number; y: number; name: string; count: number;
  } | null>(null);

  const lookup = buildLookup(data);
  const maxCount = data.length > 0 ? Math.max(...data.map((d) => d.count)) : 1;

  function getColor(numericId: string) {
    const entry = lookup[numericId];
    if (!entry) return '#e2e8f0';
    const intensity = Math.max(0.12, Math.min(1, entry.count / maxCount));
    // Orange gradient: light → deep orange
    const r = Math.round(254 - intensity * (254 - 194));
    const g = Math.round(215 - intensity * (215 - 65));
    const b = Math.round(170 - intensity * (170 - 12));
    return `rgb(${r},${g},${b})`;
  }

  return (
    <div className="relative w-full select-none overflow-hidden rounded-2xl bg-slate-50">
      {/* Tooltip */}
      {tooltip && (
        <div
          className="pointer-events-none absolute z-20 rounded-xl border border-gray-100 bg-white px-3 py-2 shadow-lg"
          style={{ left: tooltip.x + 12, top: tooltip.y - 48 }}
        >
          <p className="text-[11px] font-bold text-gray-800">{tooltip.name}</p>
          <p className="text-[13px] font-black text-orange-600">
            {tooltip.count.toLocaleString()} users
          </p>
        </div>
      )}

      <ComposableMap
        projection="geoMercator"
        projectionConfig={{ scale: 130, center: [20, 20] }}
        style={{ width: '100%', height: 'auto' }}
        height={380}
      >
        <ZoomableGroup zoom={1.0} minZoom={0.8} maxZoom={6}>
          <Geographies geography={GEO_URL}>
            {({ geographies }: { geographies: any[] }) =>
              geographies.map((geo: any) => {
                const numericId = String(geo.id);
                const entry = lookup[numericId];
                const alpha2 = entry?.alpha2?.toUpperCase() ?? '';
                const countryName =
                  COUNTRY_NAMES[alpha2] || geo.properties?.name || alpha2 || 'Unknown';
                const count = entry?.count ?? 0;

                return (
                  <Geography
                    key={geo.rsmKey}
                    geography={geo}
                    fill={getColor(numericId)}
                    stroke="#fff"
                    strokeWidth={0.4}
                    style={{
                      default: { outline: 'none', cursor: count > 0 ? 'pointer' : 'default' },
                      hover: { outline: 'none', fill: count > 0 ? '#f97316' : '#cbd5e1', cursor: count > 0 ? 'pointer' : 'default' },
                      pressed: { outline: 'none' },
                    }}
                    onMouseEnter={(evt) => {
                      if (!count) return;
                      const rect = (evt.currentTarget as SVGPathElement)
                        .closest('svg')
                        ?.parentElement?.getBoundingClientRect();
                      setTooltip({
                        x: evt.clientX - (rect?.left ?? 0),
                        y: evt.clientY - (rect?.top ?? 0),
                        name: countryName,
                        count,
                      });
                    }}
                    onMouseMove={(evt) => {
                      if (!count) return;
                      const rect = (evt.currentTarget as SVGPathElement)
                        .closest('svg')
                        ?.parentElement?.getBoundingClientRect();
                      setTooltip((prev) =>
                        prev
                          ? {
                              ...prev,
                              x: evt.clientX - (rect?.left ?? 0),
                              y: evt.clientY - (rect?.top ?? 0),
                            }
                          : null,
                      );
                    }}
                    onMouseLeave={() => setTooltip(null)}
                  />
                );
              })
            }
          </Geographies>
        </ZoomableGroup>
      </ComposableMap>

      {/* Legend */}
      <div className="flex items-center justify-end gap-2 px-4 pb-3 pt-1">
        <span className="text-[10px] font-semibold text-gray-400">Fewer</span>
        <div
          className="h-2.5 w-32 rounded-full"
          style={{
            background:
              'linear-gradient(to right, rgb(254,215,170), rgb(194,65,12))',
          }}
        />
        <span className="text-[10px] font-semibold text-gray-400">More</span>
      </div>
    </div>
  );
}
