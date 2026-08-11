# Research Notes: CONTENT-1 World Geography (1880 naval/imperial world)

> **Purpose:** Factual, historically-grounded geographic + strength data to author
> the `countries`, `areas`, `routes`, `possessions`, and `ports` YAML collections
> for the production pack `content/production/1880/` (anchor: **January 1880**).
> Deliverable file per CONTENT-0 content map (`docs/research/content-0-content-map.md`).
>
> **Data model target (author-time schema):**
>
> - `countries`: `{id, name, tag(3-letter uppercase), color?}`
> - `areas`: `{id, name, type: "land"|"sea"|"coastal", controller?(country id)}`
> - `routes`: `{id, from(area id), to(area id), type: "land"|"sea"|"rail", distance(integer km)}`
> - `possessions`: `{id, countryId(owner), areaId}`
> - `ports`: `{id, name, areaId, countryId, level(1-10)}`
>
> **Grounding rule:** Nothing below is invented. Each claim is anchored to
> historically-attested 1880 conditions and cites a source (Wikipedia / Britannica
> article names at minimum). Where I estimate a route distance, it is flagged as
> an **estimate** and cross-checked against known geographic baselines.

---

## 0. Start-date boundary conditions (Jan 1880) — fixes that matter

These are the easily-mis-authorted edge cases. They are **not** in original-owner
states we might expect from a later "imperial" lens:

| Subject                        | State on 1 Jan 1880                                                                                                                                                                                                                                                                  | Source                                                                   |
| ------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------ |
| **Egypt & Suez**               | Egypt is a nominally-autonomous **Ottoman** province (`Khedivate of Egypt`, 1867–1914). British troop occupation begins only in **1882** (Anglo-Egyptian War). Britain has owned 44% of Suez Canal shares since **1875** (financial, not sovereign). Suez Canal open since **1869**. | "History of Egypt under the British"; "Khedivate of Egypt"; "Suez Canal" |
| **Germany (colonies)**         | German colonial empire begins **1884**. In Jan 1880 Germany has **no overseas colonies**; its navy is Baltic/North-Sea home only (Kiel, Wilhelmshaven).                                                                                                                              | "German colonial empire" (established 1884)                              |
| **Cyprus**                     | Under **British administration** since 1878 (Cyprus Convention, Congress of Berlin); _de jure_ Ottoman until 1914. Treat as UK-controlled in 1880.                                                                                                                                   | "Cyprus"; "British Cyprus"                                               |
| **Tunisia**                    | Still Ottoman on 1 Jan 1880; French protectorate begins **1881**. Treat as Ottoman at anchor.                                                                                                                                                                                        | "French protectorate of Tunisia"                                         |
| **Italy (colonies)**           | Essentially none in Africa in 1880 (Assab purchased by a private co. 1869; state annexed 1882; Eritrea colony ~1890). Italy is Adriatic/Tyrrhenian home-focused.                                                                                                                     | "Italian Empire"; "Italian Eritrea"                                      |
| **USA (colonies)**             | No overseas colonies in 1880 (Alaska purchased 1867; Hawaii/Philippines/Puerto Rico/Guam come 1898). Small post-Civil-War navy.                                                                                                                                                      | "Territorial evolution of the United States"                             |
| **Japan (colonies)**           | No overseas colonies in 1880. Meiji modernisation; Ryukyu/Okinawa annexed 1879; navy base Yokosuka active; Kure/Sasebo developing.                                                                                                                                                   | "Imperial Japanese Navy"; "Okinawa Prefecture"                           |
| **Alaska**                     | US since 1867 (not Russian).                                                                                                                                                                                                                                                         | "Alaska Purchase"                                                        |
| **China (Qing)**               | Qing dynasty; Beiyang (Northern) Fleet being built from mid-1870s; bases Weihaiwei, Port Arthur (Lüshun) leased Russian only 1898 — Qing-controlled in 1880.                                                                                                                         | "Beiyang Fleet"; "History of the Qing dynasty"                           |
| **Netherlands/Portugal/Spain** | Established but shrinking colonial empires (below). Spain retains Cuba, Puerto Rico, Philippines.                                                                                                                                                                                    | "Dutch colonial empire"; "Portuguese Empire"; "Spanish Empire"           |

**Design implication:** In 1880 the **UK** is the sole global network power. France is
second. The "imperial" map is heavily concentrated in UK hands, with Spain, Portugal,
the Netherlands holding legacy colonies, and Germany/Italy/Japan/USA essentially
**home-waters-only** at anchor start. This is exactly what CONTENT-1 must reproduce so
campaign physics (DESIGN-14 route edges, home/build-area assignments) reflect reality.

---

## 1. Major naval powers and their empire holdings (1880)

### 1.1 Country registry (concrete IDs/tags)

| id    | name             | tag   | colour (suggested) | Source             |
| ----- | ---------------- | ----- | ------------------ | ------------------ |
| `gbr` | United Kingdom   | `GBR` | red                | "United Kingdom"   |
| `fra` | France           | `FRA` | blue               | "France"           |
| `ger` | German Empire    | `GER` | black              | "German Empire"    |
| `rus` | Russian Empire   | `RUS` | green              | "Russian Empire"   |
| `auh` | Austria-Hungary  | `AUH` | yellow             | "Austria-Hungary"  |
| `ita` | Kingdom of Italy | `ITA` | light-green        | "Kingdom of Italy" |
| `usa` | United States    | `USA` | light-blue         | "United States"    |
| `jpn` | Empire of Japan  | `JPN` | white              | "Empire of Japan"  |
| `ott` | Ottoman Empire   | `OTT` | turquoise          | "Ottoman Empire"   |
| `spa` | Spain            | `SPA` | gold               | "Spain"            |
| `ned` | Netherlands      | `NED` | orange             | "Netherlands"      |
| `por` | Portugal         | `POR` | dark-green         | "Portugal"         |
| `chi` | Qing China       | `CHI` | cyan               | "Qing dynasty"     |
| `bra` | Empire of Brazil | `BRA` | green-yellow       | "Empire of Brazil" |

### 1.2 Holdings per power (major territorial/colonial possessions)

**United Kingdom (`gbr`)** — world's largest navy & empire; the only global network.
Source: "British Empire", "Pax Britannica".

- Home: England, Scotland, Wales, Ireland.
- Asia: **British Raj (India)**, Ceylon (Sri Lanka), Burma (Lower Burma), Straits Settlements (Singapore/Penang/Malacca), Hong Kong.
- Mediterranean/M.E.: Gibraltar, **Malta**, **Cyprus** (UK-admin. 1878), Aden.
- Africa: Cape Colony, Natal, Gold Coast, Lagos, Sierra Leone, Gambia, Mauritius, Seychelles, Zanzibar (sphere of influence; protectorate 1890).
- Pacific/Oceania: Australia (several colonies), New Zealand, Fiji (annexed 1874).
- Americas/Atlantic: Canada, Bermuda, Jamaica, Bahamas, Trinidad, British Guiana, British Honduras, Falklands.

**France (`fra`)** — second navy. Source: "French colonial empire".

- Home: metropolitan France.
- North Africa: **Algeria** (1830–), Tunisia (not yet — 1881).
- Africa: Senegal, French Sudan (claims), Gabon/Congo coast, Madagascar (influence), Réunion, Mayotte.
- Asia: **Cochinchina** (S. Vietnam, 1862), Annam/Tonkin influences (protectorates 1883–84), Pondicherry & French India enclaves.
- Pacific: **New Caledonia** (1853), **French Polynesia/Tahiti** (annexed 1880), Marquesas.
- Americas: Martinique, Guadeloupe, French Guiana.

**German Empire (`ger`)** — rising navy, **no colonies in 1880**. Source: "German colonial empire".

- Home only: North Sea + Baltic coasts.

**Russia (`rus`)** — large but regionally-blocked navy. Source: "Russian Empire", "Imperial Russian Navy".

- Baltic: Finland, Baltic provinces, St Petersburg/Kronstadt.
- Black Sea: southern Russia/Ukraine coasts, Sevastopol.
- Pacific: Siberia, **Vladivostok** (founded 1860). Alaska no longer Russian (sold 1867).
- Congress Poland, Caucasus.

**Austria-Hungary (`auh`)** — Adriatic-focused; no colonies. Source: "Austro-Hungarian Navy".

- Home: Adriatic coast (Trieste, Pola/Pula, Fiume/Rijeka), Dalmatia.

**Italy (`ita`)** — modernising, rising challenger; essentially no colonies in 1880. Source: "Regia Marina", "Italian Empire".

- Home: Tyrrhenian/Adriatic/Ionian coasts.

**USA (`usa`)** — weak navy post-Civil War; no colonies. Source: "United States Navy", "Territorial evolution of the United States".

- Home: Atlantic/Pacific coasts; Alaska (1867); Midway (1867).

**Japan (`jpn`)** — modernising Meiji navy. Source: "Imperial Japanese Navy".

- Home: Honshu/Kyushu/Shikoku coasts; Ryukyu/Okinawa (1879).

**Ottoman Empire (`ott`)** — declining; navy neglected. Source: "Ottoman Navy".

- Anatolia, Balkans, Thrace, Aegean islands, Syria/Palestine, Iraq/Arabia, **Egypt** (nominal), Tripolitania/Libya, Tunisia (nominal until 1881). Cyprus nominal (UK-admin since 1878).

**Spain (`spa`)** — declining but substantial legacy empire. Source: "Spanish Empire".

- Cuba, Puerto Rico, Philippines, Caroline/Mariana Islands, Palau/Sulu (Muslim sultanate), Spanish North Africa (Ceuta, Melilla), Rio de Oro (Western Sahara coast), Spanish Guinea (Fernando Po).

**Netherlands (`ned`)** — major Far-East empire. Source: "Dutch colonial empire".

- **Dutch East Indies (Indonesia)**, Suriname, Curaçao/Dutch Antilles, Dutch Gold Coast (sold to UK 1872).

**Portugal (`por`)** — oldest empire, still large in Africa/Asia. Source: "Portuguese Empire".

- **Angola**, **Mozambique**, Portuguese Guinea-Bissau, Cape Verde, São Tomé & Príncipe, Macau, Portuguese Timor, Goa & Portuguese India.

**Qing China (`chi`)** — large land power, weak but modernising navy. Source: "Beiyang Fleet".

- Home: coastal provinces; nominal suzerainty over Korea, the Ryukyus (lost 1879), Annam/Tonkin, Tibet, Mongolia. Weihaiwei & Port Arthur as northern fleet bases.

**Empire of Brazil (`bra`)** — small navy, regional. Source: "Empire of Brazil", "Brazilian Navy".

- Home: Brazil's Atlantic coast.

---

## 2. Coastal areas / regions per power (naval-game relevant)

Schema: `areas: {id, name, type: "land"|"sea"|"coastal", controller?}`. These are the
strategic areas CONTENT-1 should model. IDs are namespaced by region (stable, unique).
Sea/coastal areas have no `controller` in the geographic sense (ownership is via
possessions); land/coastal areas tied to a power set `controller`.

### 2.1 United Kingdom

| area id             | name                                              | type    | controller? |
| ------------------- | ------------------------------------------------- | ------- | ----------- |
| `eng_home_coast`    | English Home Waters (Channel + N. Sea approaches) | coastal | gbr         |
| `med_gibraltar`     | Gibraltar                                         | coastal | gbr         |
| `med_malta`         | Malta                                             | coastal | gbr         |
| `med_cyprus`        | Cyprus                                            | coastal | gbr         |
| `india_west_coast`  | West India (Bombay/Malabar)                       | coastal | gbr         |
| `india_east_coast`  | East India (Madras/Bengal)                        | coastal | gbr         |
| `indian_ceylon`     | Ceylon                                            | coastal | gbr         |
| `sea_singapore`     | Singapore / Straits                               | coastal | gbr         |
| `sea_hong_kong`     | Hong Kong                                         | coastal | gbr         |
| `africa_cape`       | Cape of Good Hope                                 | coastal | gbr         |
| `atlantic_bermuda`  | Bermuda                                           | coastal | gbr         |
| `americas_halifax`  | Halifax / N. America                              | coastal | gbr         |
| `pacific_australia` | Australia / NZ                                    | coastal | gbr         |
| `indian_adden`      | Aden                                              | coastal | gbr         |
| `sea_mauritius`     | Mauritius                                         | coastal | gbr         |

### 2.2 France

| area id                 | name                          | type    | controller? |
| ----------------------- | ----------------------------- | ------- | ----------- |
| `fra_med_coast`         | French Mediterranean coast    | coastal | fra         |
| `fra_chan_coast`        | French Channel/Atlantic coast | coastal | fra         |
| `africa_algeria`        | Algeria                       | coastal | fra         |
| `africa_senegal`        | Senegal                       | coastal | fra         |
| `indochina_cochinchina` | Cochinchina (Saigon)          | coastal | fra         |
| `pacific_newcaledonia`  | New Caledonia                 | coastal | fra         |
| `pacific_tahiti`        | French Polynesia              | coastal | fra         |
| `americas_martinique`   | Martinique / Guadeloupe       | coastal | fra         |
| `indian_reunion`        | Réunion / Indian Ocean        | coastal | fra         |

### 2.3 Germany (home only)

| area id               | name                   | type    | controller? |
| --------------------- | ---------------------- | ------- | ----------- |
| `ger_baltic_coast`    | German Baltic coast    | coastal | ger         |
| `ger_ndgermany_coast` | German North Sea coast | coastal | ger         |

### 2.4 Russia

| area id              | name                           | type    | controller? |
| -------------------- | ------------------------------ | ------- | ----------- |
| `rus_baltic_coast`   | Baltic coast (Kronstadt/St P.) | coastal | rus         |
| `rus_blacksea_coast` | Black Sea coast (Sevastopol)   | coastal | rus         |
| `rus_pacific_coast`  | Pacific coast (Vladivostok)    | coastal | rus         |

### 2.5 Austria-Hungary

| area id              | name                          | type    | controller? |
| -------------------- | ----------------------------- | ------- | ----------- |
| `auh_adriatic_coast` | Adriatic coast (Pola/Trieste) | coastal | auh         |
| `auh_dalmatia`       | Dalmatia                      | coastal | auh         |

### 2.6 Italy

| area id                | name                                   | type    | controller? |
| ---------------------- | -------------------------------------- | ------- | ----------- |
| `ita_tyrrhenian_coast` | Tyrrhenian coast (La Spezia/Naples)    | coastal | ita         |
| `ita_adriatic_coast`   | Adriatic/Ionian coast (Taranto/Venice) | coastal | ita         |

### 2.7 USA

| area id              | name                 | type    | controller? |
| -------------------- | -------------------- | ------- | ----------- |
| `usa_atlantic_coast` | US Atlantic coast    | coastal | usa         |
| `usa_pacific_coast`  | US Pacific coast     | coastal | usa         |
| `usa_gulf_coast`     | Gulf of Mexico coast | coastal | usa         |

### 2.8 Japan

| area id            | name                               | type    | controller? |
| ------------------ | ---------------------------------- | ------- | ----------- |
| `jpn_home_coast`   | Japan home waters (Tokyo/Yokosuka) | coastal | jpn         |
| `jpn_inland_sea`   | Inland Sea (Kure)                  | coastal | jpn         |
| `jpn_kyushu_coast` | Kyushu (Sasebo/Nagasaki)           | coastal | jpn         |

### 2.9 Ottoman Empire

| area id              | name                               | type    | controller? |
| -------------------- | ---------------------------------- | ------- | ----------- |
| `ott_marmara_coast`  | Bosphorus/Marmara (Constantinople) | coastal | ott         |
| `ott_aegean_coast`   | Aegean coast                       | coastal | ott         |
| `ott_blacksea_coast` | Ottoman Black Sea coast            | coastal | ott         |
| `ott_eg_coast`       | Ottoman Egypt (Alexandria/Suez)    | coastal | ott         |

### 2.10 Spain

| area id               | name                                    | type    | controller? |
| --------------------- | --------------------------------------- | ------- | ----------- |
| `spa_med_coast`       | Spanish Mediterranean coast (Cartagena) | coastal | spa         |
| `spa_atlantic_coast`  | Spanish Atlantic coast (Ferrol/Cadiz)   | coastal | spa         |
| `americas_cuba`       | Cuba                                    | coastal | spa         |
| `americas_puertorico` | Puerto Rico                             | coastal | spa         |
| `philippines_luzon`   | Luzon (Manila)                          | coastal | spa         |

### 2.11 Netherlands

| area id             | name                    | type    | controller? |
| ------------------- | ----------------------- | ------- | ----------- |
| `ned_home_coast`    | Netherlands home coast  | coastal | ned         |
| `dei_java`          | Java (Batavia/Surabaya) | coastal | ned         |
| `americas_suriname` | Suriname / Antilles     | coastal | ned         |

### 2.12 Portugal

| area id             | name                   | type    | controller? |
| ------------------- | ---------------------- | ------- | ----------- |
| `por_home_coast`    | Portugal home coast    | coastal | por         |
| `africa_angola`     | Angola                 | coastal | por         |
| `africa_mozambique` | Mozambique             | coastal | por         |
| `asia_macau`        | Macau                  | coastal | por         |
| `asia_goa`          | Goa / Portuguese India | coastal | por         |

### 2.13 China

| area id           | name                             | type    | controller? |
| ----------------- | -------------------------------- | ------- | ----------- |
| `chi_north_coast` | North China coast (Tianjin/Taku) | coastal | chi         |
| `chi_weihaiwei`   | Weihaiwei / Shandong             | coastal | chi         |
| `chi_south_coast` | South China coast (Guangzhou)    | coastal | chi         |
| `chi_yangtze`     | Yangtze estuary (Shanghai)       | coastal | chi         |

### 2.14 Brazil

| area id         | name                       | type    | controller? |
| --------------- | -------------------------- | ------- | ----------- |
| `bra_rio_coast` | Rio de Janeiro / SE Brazil | coastal | bra         |
| `bra_ne_coast`  | NE Brazil (Bahia/Recife)   | coastal | bra         |

### 2.15 Shared sea zones (no controller; type "sea")

| area id               | name                           | type |
| --------------------- | ------------------------------ | ---- |
| `sea_english_channel` | English Channel                | sea  |
| `sea_north_sea`       | North Sea                      | sea  |
| `sea_baltic`          | Baltic Sea                     | sea  |
| `sea_mediterranean_w` | Western Mediterranean          | sea  |
| `sea_mediterranean_c` | Central Mediterranean          | sea  |
| `sea_mediterranean_e` | Eastern Mediterranean / Levant | sea  |
| `sea_black_sea`       | Black Sea                      | sea  |
| `sea_red_sea`         | Red Sea                        | sea  |
| `sea_arabian_sea`     | Arabian Sea                    | sea  |
| `sea_bayofbengal`     | Bay of Bengal                  | sea  |
| `sea_south_china`     | South China Sea                | sea  |
| `sea_java_sea`        | Java Sea / SE Asia             | sea  |
| `sea_pacific_n`       | North Pacific                  | sea  |
| `sea_pacific_s`       | South Pacific                  | sea  |
| `sea_atlantic_n`      | North Atlantic                 | sea  |
| `sea_atlantic_s`      | South Atlantic                 | sea  |
| `sea_indian_ocean`    | Indian Ocean                   | sea  |
| `sea_caribbean`       | Caribbean                      | sea  |

---

## 3. Major ports per power (1880 importance, level 1–10)

Schema: `ports: {id, name, areaId, countryId, level(1-10)}`. Level weights strategic
value, size, and naval/coaling importance for a **1880** navy. Home dockyards of the
great powers rate highest.

### 3.1 United Kingdom (level via Source: "List of Royal Navy shore establishments", "HMNB Portsmouth", "HMNB Devonport")

| port id          | name                     | areaId            | countryId | level |
| ---------------- | ------------------------ | ----------------- | --------- | ----- |
| `gbr_portsmouth` | Portsmouth               | eng_home_coast    | gbr       | 10    |
| `gbr_plymouth`   | Plymouth (Devonport)     | eng_home_coast    | gbr       | 10    |
| `gbr_chatham`    | Chatham                  | eng_home_coast    | gbr       | 8     |
| `gbr_sheerness`  | Sheerness                | eng_home_coast    | gbr       | 6     |
| `gbr_gibraltar`  | Gibraltar                | med_gibraltar     | gbr       | 8     |
| `gbr_valletta`   | Valletta (Malta)         | med_malta         | gbr       | 8     |
| `gbr_cyprus`     | Famagusta/Limassol       | med_cyprus        | gbr       | 4     |
| `gbr_halifax`    | Halifax                  | americas_halifax  | gbr       | 6     |
| `gbr_bermuda`    | Bermuda                  | atlantic_bermuda  | gbr       | 7     |
| `gbr_bombay`     | Bombay (Mumbai)          | india_west_coast  | gbr       | 8     |
| `gbr_calcutta`   | Calcutta                 | india_east_coast  | gbr       | 6     |
| `gbr_colombo`    | Colombo (Ceylon)         | indian_ceylon     | gbr       | 7     |
| `gbr_singapore`  | Singapore                | sea_singapore     | gbr       | 7     |
| `gbr_hongkong`   | Hong Kong                | sea_hong_kong     | gbr       | 7     |
| `gbr_capetown`   | Cape Town (Simon's Town) | africa_cape       | gbr       | 7     |
| `gbr_simonstown` | Simon's Town             | africa_cape       | gbr       | 7     |
| `gbr_adden`      | Aden                     | indian_adden      | gbr       | 6     |
| `gbr_sydney`     | Sydney                   | pacific_australia | gbr       | 6     |
| `gbr_melbourne`  | Melbourne                | pacific_australia | gbr       | 5     |
| `gbr_auckland`   | Auckland                 | pacific_australia | gbr       | 5     |

### 3.2 France (Source: "Arsenal de Brest", "Arsenal de Toulon", "Cherbourg-en-Cotentin")

| port id             | name           | areaId                | countryId | level |
| ------------------- | -------------- | --------------------- | --------- | ----- |
| `fra_brest`         | Brest          | fra_chan_coast        | fra       | 9     |
| `fra_toulon`        | Toulon         | fra_med_coast         | fra       | 9     |
| `fra_cherbourg`     | Cherbourg      | fra_chan_coast        | fra       | 8     |
| `fra_rochefort`     | Rochefort      | fra_chan_coast        | fra       | 6     |
| `fra_algiers`       | Algiers        | africa_algeria        | fra       | 7     |
| `fra_oran`          | Oran           | africa_algeria        | fra       | 6     |
| `fra_saigon`        | Saigon         | indochina_cochinchina | fra       | 5     |
| `fra_noumea`        | Nouméa         | pacific_newcaledonia  | fra       | 5     |
| `fra_fortde_france` | Fort-de-France | americas_martinique   | fra       | 4     |

### 3.3 Germany (source: "Kiel", "Wilhelmshaven", "Kaiserliche Marine")

| port id             | name          | areaId              | countryId | level |
| ------------------- | ------------- | ------------------- | --------- | ----- |
| `ger_kiel`          | Kiel          | ger_baltic_coast    | ger       | 8     |
| `ger_wilhelmshaven` | Wilhelmshaven | ger_ndgermany_coast | ger       | 8     |
| `ger_danzig`        | Danzig        | ger_baltic_coast    | ger       | 6     |
| `ger_stralsund`     | Stralsund     | ger_baltic_coast    | ger       | 4     |

### 3.4 Russia (source: "Kronstadt", "Sevastopol", "Vladivostok")

| port id            | name            | areaId             | countryId | level |
| ------------------ | --------------- | ------------------ | --------- | ----- |
| `rus_kronstadt`    | Kronstadt       | rus_baltic_coast   | rus       | 8     |
| `rus_stpetersburg` | St Petersburg   | rus_baltic_coast   | rus       | 7     |
| `rus_reval`        | Reval (Tallinn) | rus_baltic_coast   | rus       | 5     |
| `rus_sevastopol`   | Sevastopol      | rus_blacksea_coast | rus       | 8     |
| `rus_nikolayev`    | Nikolayev       | rus_blacksea_coast | rus       | 6     |
| `rus_odessa`       | Odessa          | rus_blacksea_coast | rus       | 5     |
| `rus_vladivostok`  | Vladivostok     | rus_pacific_coast  | rus       | 5     |

### 3.5 Austria-Hungary (source: "Pola (naval base)", "Trieste")

| port id       | name           | areaId             | countryId | level |
| ------------- | -------------- | ------------------ | --------- | ----- |
| `auh_pola`    | Pola (Pula)    | auh_adriatic_coast | auh       | 7     |
| `auh_trieste` | Trieste        | auh_adriatic_coast | auh       | 6     |
| `auh_fiume`   | Fiume (Rijeka) | auh_dalmatia       | auh       | 4     |

### 3.6 Italy (source: "La Spezia", "Taranto", "Regia Marina")

| port id        | name      | areaId               | countryId | level |
| -------------- | --------- | -------------------- | --------- | ----- |
| `ita_laspezia` | La Spezia | ita_tyrrhenian_coast | ita       | 7     |
| `ita_naples`   | Naples    | ita_tyrrhenian_coast | ita       | 5     |
| `ita_taranto`  | Taranto   | ita_adriatic_coast   | ita       | 7     |
| `ita_genoa`    | Genoa     | ita_tyrrhenian_coast | ita       | 5     |
| `ita_venice`   | Venice    | ita_adriatic_coast   | ita       | 5     |

### 3.7 USA (source: "Brooklyn Navy Yard", "Norfolk Naval Shipyard", "Mare Island")

| port id            | name                          | areaId             | countryId | level |
| ------------------ | ----------------------------- | ------------------ | --------- | ----- |
| `usa_norfolk`      | Norfolk                       | usa_atlantic_coast | usa       | 6     |
| `usa_newyork`      | New York (Brooklyn Navy Yard) | usa_atlantic_coast | usa       | 6     |
| `usa_boston`       | Boston                        | usa_atlantic_coast | usa       | 4     |
| `usa_philadelphia` | Philadelphia                  | usa_atlantic_coast | usa       | 4     |
| `usa_mare_island`  | Mare Island (SF)              | usa_pacific_coast  | usa       | 4     |
| `usa_keywest`      | Key West                      | usa_gulf_coast     | usa       | 4     |
| `usa_pensacola`    | Pensacola                     | usa_gulf_coast     | usa       | 4     |

### 3.8 Japan (source: "Yokosuka Naval Arsenal", "Kure Naval Arsenal", "Sasebo Naval Arsenal")

| port id        | name           | areaId           | countryId | level |
| -------------- | -------------- | ---------------- | --------- | ----- |
| `jpn_yokosuka` | Yokosuka       | jpn_home_coast   | jpn       | 6     |
| `jpn_yokohama` | Yokohama/Tokyo | jpn_home_coast   | jpn       | 6     |
| `jpn_kure`     | Kure           | jpn_inland_sea   | jpn       | 5     |
| `jpn_sasebo`   | Sasebo         | jpn_kyushu_coast | jpn       | 5     |
| `jpn_nagasaki` | Nagasaki       | jpn_kyushu_coast | jpn       | 5     |

### 3.9 Ottoman Empire (source: "Ottoman Navy", "Istanbul", "Izmir")

| port id              | name                      | areaId             | countryId | level |
| -------------------- | ------------------------- | ------------------ | --------- | ----- |
| `ott_constantinople` | Constantinople (Istanbul) | ott_marmara_coast  | ott       | 7     |
| `ott_smyrna`         | Smyrna (Izmir)            | ott_aegean_coast   | ott       | 5     |
| `ott_sinope`         | Sinope                    | ott_blacksea_coast | ott       | 4     |
| `ott_alexandria`     | Alexandria                | ott_eg_coast       | ott       | 5     |

### 3.10 Spain (source: "Ferrol", "Cartagena", "Arsenal de la Carraca", "Manila")

| port id         | name      | areaId             | countryId | level |
| --------------- | --------- | ------------------ | --------- | ----- |
| `spa_ferrol`    | Ferrol    | spa_atlantic_coast | spa       | 6     |
| `spa_cadiz`     | Cadiz     | spa_atlantic_coast | spa       | 5     |
| `spa_cartagena` | Cartagena | spa_med_coast      | spa       | 6     |
| `spa_havana`    | Havana    | americas_cuba      | spa       | 6     |
| `spa_manila`    | Manila    | philippines_luzon  | spa       | 5     |
| `spa_cavite`    | Cavite    | philippines_luzon  | spa       | 5     |

### 3.11 Netherlands (source: "Den Helder", "Batavia", "Surabaya")

| port id          | name                  | areaId         | countryId | level |
| ---------------- | --------------------- | -------------- | --------- | ----- |
| `ned_denhelder`  | Den Helder (Texel)    | ned_home_coast | ned       | 6     |
| `ned_vlissingen` | Vlissingen (Flushing) | ned_home_coast | ned       | 5     |
| `ned_batavia`    | Batavia (Jakarta)     | dei_java       | ned       | 6     |
| `ned_surabaya`   | Surabaya              | dei_java       | ned       | 6     |

### 3.12 Portugal (source: "Lisbon", "Luanda", "Mozambique (city)")

| port id                | name             | areaId            | countryId | level |
| ---------------------- | ---------------- | ----------------- | --------- | ----- |
| `por_lisbon`           | Lisbon           | por_home_coast    | por       | 5     |
| `por_luanda`           | Luanda           | africa_angola     | por       | 5     |
| `por_lourenco_marques` | Lourenço Marques | africa_mozambique | por       | 4     |
| `por_macau`            | Macau            | asia_macau        | por       | 4     |
| `por_goa`              | Goa              | asia_goa          | por       | 4     |

### 3.13 China (source: "Beiyang Fleet", "Weihaiwei", "History of Shanghai")

| port id           | name                 | areaId          | countryId | level |
| ----------------- | -------------------- | --------------- | --------- | ----- |
| `chi_taku`        | Taku (near Tianjin)  | chi_north_coast | chi       | 5     |
| `chi_weihaiwei`   | Weihaiwei            | chi_weihaiwei   | chi       | 6     |
| `chi_port_arthur` | Port Arthur (Lüshun) | chi_north_coast | chi       | 6     |
| `chi_shanghai`    | Shanghai             | chi_yangtze     | chi       | 5     |
| `chi_guangzhou`   | Guangzhou (Canton)   | chi_south_coast | chi       | 5     |

### 3.14 Brazil (source: "Brazilian Navy", "Rio de Janeiro")

| port id             | name                           | areaId        | countryId | level |
| ------------------- | ------------------------------ | ------------- | --------- | ----- |
| `bra_rio`           | Rio de Janeiro                 | bra_rio_coast | bra       | 6     |
| `bra_salvador`      | Salvador (Bahia)               | bra_ne_coast  | bra       | 4     |
| `bra_recife`        | Recife (Pernambuco)            | bra_ne_coast  | bra       | 4     |
| `bra_ilhadascobras` | Ilha das Cobras (Rio dockyard) | bra_rio_coast | bra       | 5     |

---

## 4. Sea-area route suggestions (with plausible km distances)

Schema: `routes: {id, from(area), to(area), type: "sea"|"land"|"rail", distance(integer)}`.

Distances are **plausible rounded straight-ish (great-circle/shortest practical)
kilometres** and are flagged as estimates. They are cross-checked against known
baselines: Gibraltar↔Malta ≈ 1,900; Gibraltar↔Port Said ≈ 3,200; Suez Red-Sea leg
Suez↔Aden ≈ 1,900; Suez Canal itself ≈ 160 km canal length; Plymouth↔Halifax ≈ 4,400;
Plymouth↔Cape Town ≈ ~9,800; Bombay↔Ceylon/Colombo ≈ 1,600; Singapore↔Hong Kong ≈
~2,600; Hong Kong↔Yokohama ≈ ~2,800.

### 4.1 Atlantic / Imperial highways

| route id            | from                | to                  | type | distance (km) | basis                       |
| ------------------- | ------------------- | ------------------- | ---- | ------------- | --------------------------- |
| `r_chan_gib`        | sea_english_channel | sea_mediterranean_w | sea  | 1700          | Portsmouth→Gibraltar (est.) |
| `r_gib_medw`        | sea_mediterranean_w | med_gibraltar       | sea  | 10            | Gibraltar strait            |
| `r_ply_halifax`     | sea_atlantic_n      | americas_halifax    | sea  | 4400          | N. Atlantic (est.)          |
| `r_ply_capetown`    | sea_atlantic_n      | africa_cape         | sea  | 9800          | Plymouth→Cape (est.)        |
| `r_capetown_bombay` | africa_cape         | sea_arabian_sea     | sea  | 8000          | Cape→Bombay (est.)          |
| `r_rio_capetown`    | sea_atlantic_s      | africa_cape         | sea  | 6800          | Rio→Cape (est.)             |
| `r_carib_home`      | sea_caribbean       | sea_atlantic_n      | sea  | 6000          | Caribbean→UK (est.)         |

### 4.2 Mediterranean

| route id           | from                | to                  | type | distance (km) | basis                   |
| ------------------ | ------------------- | ------------------- | ---- | ------------- | ----------------------- |
| `r_gib_malta`      | sea_mediterranean_w | sea_mediterranean_c | sea  | 1900          | Gibraltar→Malta (est.)  |
| `r_malta_suez`     | sea_mediterranean_c | sea_mediterranean_e | sea  | 1400          | Malta→Port Said (est.)  |
| `r_med_eg`         | sea_mediterranean_e | ott_eg_coast        | sea  | 20            | Alexandria/Suez         |
| `r_malta_constant` | sea_mediterranean_e | ott_marmara_coast   | sea  | 900           | via Aegean (est.)       |
| `r_toulon_gib`     | fra_med_coast       | sea_mediterranean_w | sea  | 1200          | Toulon→Gibraltar (est.) |

### 4.3 Red Sea / Suez / Indian Ocean (the UK-India lifeline via Suez)

| route id             | from            | to              | type | distance (km) | basis                       |
| -------------------- | --------------- | --------------- | ---- | ------------- | --------------------------- |
| `r_suez_canal`       | ott_eg_coast    | sea_red_sea     | sea  | 160           | Suez Canal length           |
| `r_redsea_adden`     | sea_red_sea     | indian_adden    | sea  | 1900          | Suez→Aden (est.)            |
| `r_adden_bombay`     | indian_adden    | sea_arabian_sea | sea  | 2700          | Aden→Bombay (est.)          |
| `r_bombay_ceylon`    | sea_arabian_sea | indian_ceylon   | sea  | 1600          | Bombay→Colombo (est.)       |
| `r_ceylon_singapore` | indian_ceylon   | sea_singapore   | sea  | 2700          | Colombo→Singapore (est.)    |
| `r_adden_bar`        | indian_adden    | sea_bayofbengal | sea  | 3300          | Aden→Madras/Calcutta (est.) |

### 4.4 Far East / Pacific

| route id           | from              | to                | type | distance (km) | basis                      |
| ------------------ | ----------------- | ----------------- | ---- | ------------- | -------------------------- |
| `r_singapore_hk`   | sea_singapore     | sea_hong_kong     | sea  | 2600          | Singapore→Hong Kong (est.) |
| `r_singapore_java` | sea_singapore     | dei_java          | sea  | 900           | Singapore→Batavia (est.)   |
| `r_hk_yokohama`    | sea_hong_kong     | sea_pacific_n     | sea  | 2800          | Hong Kong→Yokohama (est.)  |
| `r_hk_manila`      | sea_hong_kong     | philippines_luzon | sea  | 1150          | Hong Kong→Manila (est.)    |
| `r_manila_java`    | sea_south_china   | dei_java          | sea  | 2600          | via SCS (est.)             |
| `r_sf_yokohama`    | usa_pacific_coast | sea_pacific_n     | sea  | 8200          | SF→Yokohama (est.)         |
| `r_vlad_pacific`   | rus_pacific_coast | sea_pacific_n     | sea  | 1000          | Vladivostok→open Pacific   |

### 4.5 Europe home waters (North Sea / Baltic / Channel)

| route id         | from                | to                  | type | distance (km) | basis                            |
| ---------------- | ------------------- | ------------------- | ---- | ------------- | -------------------------------- |
| `r_chan_north`   | sea_english_channel | sea_north_sea       | sea  | 400           | Channel→N. Sea (est.)            |
| `r_north_baltic` | sea_north_sea       | sea_baltic          | sea  | 700           | via Skagerrak/Kattegat (est.)    |
| `r_baltic_kron`  | sea_baltic          | rus_baltic_coast    | sea  | 600           | Baltic→Kronstadt (est.)          |
| `r_north_ger`    | sea_north_sea       | ger_ndgermany_coast | sea  | 100           | Helgoland/Wilhelmshaven          |
| `r_chan_fra`     | sea_english_channel | fra_chan_coast      | sea  | 100           | across Channel                   |
| `r_med_black`    | sea_mediterranean_e | sea_black_sea       | sea  | 700           | via Bosphorus/Dardanelles (est.) |

### 4.6 Land / rail (few strategic examples)

| route id                    | from             | to                  | type | distance (km) | basis                                       |
| --------------------------- | ---------------- | ------------------- | ---- | ------------- | ------------------------------------------- |
| `r_ger_rail_kiel_wilhelmsh` | ger_baltic_coast | ger_ndgermany_coast | rail | 200           | Kiel Canal-corridor / N. German rail (est.) |
| `r_india_west_east`         | india_west_coast | india_east_coast    | rail | 1600          | Bombay→Calcutta rail (est.)                 |
| `r_rus_baltic_peter`        | rus_baltic_coast | rus_blacksea_coast  | land | 1800          | overland cross-Russia (est.)                |

---

## 5. Fix list (what an author must NOT silently "update" during 1880–1970)

Reachability-friendly notes so CONTENT-1 can stay honest about anchor-start:

- **Suez Canal** exists and is open (1869); **Panama Canal does not exist** (1914) — no
  Pacific↔Atlantic short cut in 1880.
- **Egypt**: Ottoman, not British, at anchor start; British occupation 1882. Careful:
  do not award Egypt/Alexandria/Suez to GBR in the _starting_ possessions.
- **Germany**: no colonies at anchor start (1884+). German naval strength indexes
  entirely on home bases.
- **Tunisia**: Ottoman at anchor (French protectorate 1881).
- **Italy/USA/Japan**: home-navy powers only at anchor start.
- **Cyprus**: UK-controlled (admin. 1878) despite Ottoman de jure sovereignty.
- **Spain**: retains Cuba/Puerto Rico/Philippines (lost 1898).

---

## 6. Suggested canonical ID conventions (author-time)

- Country ids: 3-letter lowercase ISO-like (`gbr`, `fra`, …); `tag` = uppercase.
- Area ids: `<region>_<name>` snake_case, human-readable, globally unique.
- Route ids: `r_<from>_<to>` (short, unique).
- Possession ids: `poss_<country>_<area>`.
- Port ids: `<country>_<city>`.

---

## 7. Source bibliography (primary citations)

1. Wikipedia "German colonial empire" — German colonies began **1884** (no colonies at Jan 1880).
2. Wikipedia "British Empire" / "Pax Britannica" — global British holdings & naval dominance.
3. Wikipedia "History of Egypt under the British" — Egypt under British rule from **1882**; Egypt remained Ottoman de jure.
4. Wikipedia "Suez Canal" — opened **1869**.
5. Wikipedia "Cyprus" / "British Cyprus" — British administration from **1878** (Cyprus Convention).
6. Wikipedia "French colonial empire" — Algeria, Cochinchina, New Caledonia, Tahiti, etc.
7. Wikipedia "French protectorate of Tunisia" — **1881** (Ottoman at Jan 1880).
8. Wikipedia "Italian Empire" / "Italian Eritrea" — no effective African colony at 1880.
9. Wikipedia "Territorial evolution of the United States" — no 1880 overseas colonies; "Alaska Purchase" (1867).
10. Wikipedia "Imperial Japanese Navy"; "Okinawa Prefecture" — Ryukyu annexed 1879; no colonies 1880.
11. Wikipedia "Russian Empire"; "Imperial Russian Navy"; "Vladivostok" — Baltic/Black Sea/Pacific split; Alaska sold 1867.
12. Wikipedia "Austro-Hungarian Navy" — Adriatic-only navy.
13. Wikipedia "Dutch colonial empire"; "Portuguese Empire"; "Spanish Empire" — legacy empires.
14. Wikipedia "Beiyang Fleet" — Qing northern fleet being built (Weihaiwei, Port Arthur).
15. Wikipedia "Empire of Brazil"; "Brazilian Navy" — small regional navy.
16. Port-specific: Wikipedia "HMNB Portsmouth", "HMNB Devonport (Plymouth)", "Arsenal de Brest", "Arsenal de Toulon", "Kiel", "Wilhelmshaven", "Kronstadt", "Sevastopol", "Pola (naval base)", "La Spezia", "Taranto", "Yokosuka Naval Arsenal", "Den Helder", "Beiyang Fleet".

> **Note on precision:** Port _levels_ (1–10) and _route distances_ are my reasoned
> gameplay-relative estimates derived from the cited factual baselines, not
> measurements found verbatim in a single source. They are consistent with 1880
> naval reality (UK dockyards ~10; emerging powers lower). Distances use known
> great-circle baselines and are rounded to plausible integers for the integer
> `distance` field.
