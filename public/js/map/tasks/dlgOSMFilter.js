
function DlgOSMFilter(mapContainer,obj,options) {
  options=options||{};
  options.closable=false;
    options.showOKButton=false;
    options.showApplyButton=true;
    options.applyButtonTitle='Search';
  DlgTaskBase.call(this, 'DlgOSMFilter'
      ,(options.title || 'Select OSM Keys')
      ,  mapContainer,obj,options);   
  this.keys=  [{
        "key": "amenity",
        "values": ["bar", "bbq", "biergarten", "cafe", "drinking_water", "fast_food", "food_court", "ice_cream", "pub", "restaurant", "college", "kindergarten", "library", "archive", "public_bookcase", "school", "music_school", "driving_school", "language_school", "university", "research_institute", "bicycle_parking", "bicycle_repair_station", "bicycle_rental", "boat_rental", "boat_sharing", "buggy_parking", "bus_station", "car_rental", "car_sharing", "car_wash", "vehicle_inspection", "charging_station", "ferry_terminal", "fuel", "grit_bin", "motorcycle_parking", "parking", "parking_entrance", "parking_space", "taxi", "ticket_validator", "atm", "bank", "bureau_de_change", "baby_hatch", "clinic", "dentist", "doctors", "hospital", "nursing_home", "pharmacy", "social_facility", "veterinary", "arts_centre", "brothel", "casino", "cinema", "community_centre", "fountain", "gambling", "music_venue", "nightclub", "planetarium", "social_centre", "stripclub", "studio", "swingerclub", "theatre", "animal_boarding", "animal_shelter", "baking_oven", "bench", "clock", "courthouse", "coworking_space", "crematorium", "crypt", "dive_centre", "dojo", "embassy", "fire_station", "firepit", "game_feeding", "grave_yard", "gym", "hunting_stand", "internet_cafe", "kitchen", "kneipp_water_cure", "marketplace", "photo_booth", "place_of_worship", "police", "post_box", "post_depot", "post_office", "prison", "public_bath", "public_building", "ranger_station", "recycling", "rescue_station", "rv_storage", "sanitary_dump_station", "sauna", "shelter", "shower", "table", "telephone", "toilets", "townhall", "vending_machine", "waste_basket", "waste_disposal", "waste_transfer_station", "watering_place", "water_point", "user defined"]
    }, {
        "key": "boundary",
        "values": ["aboriginal_lands", "administrative", "historic", "maritime", "marker", "national_park", "political", "postal_code", "protected_area", "religious_administration", "user defined"]
    }, {
        "key": "highway",
        "values": ["motorway", "trunk", "primary", "secondary", "tertiary", "unclassified", "residential", "motorway_link", "trunk_link", "primary_link", "secondary_link", "tertiary_link", "living_street", "service", "pedestrian", "track", "bus_guideway", "escape", "raceway", "road", "footway", "bridleway", "steps", "path"]
    }, {
        "key": "landuse",
        "values": ["commercial", "construction", "industrial", "residential", "retail", "allotments", "basin", "brownfield", "cemetery", "conservation", "depot", "farmland", "farmyard", "forest", "garages", "grass", "greenfield", "greenhouse_horticulture", "landfill", "meadow", "military", "orchard", "pasture", "peat_cutting", "plant_nursery", "port", "quarry", "railway", "recreation_ground", "religious", "reservoir", "salt_pond", "village_green", "vineyard", "user defined"]
    }, {
        "key": "leisure",
        "values": ["adult_gaming_centre", "amusement_arcade", "bandstand", "beach_resort", "bird_hide", "bowling_alley", "common", "dance", "disc_golf_course", "dog_park", "escape_game", "firepit", "fishing", "fitness_centre", "garden", "golf_course", "hackerspace", "horse_riding", "ice_rink", "marina", "miniature_golf", "nature_reserve", "park", "picnic_table", "pitch", "playground", "sauna", "slipway", "sports_centre", "stadium", "summer_camp", "swimming_area", "swimming_pool", "track", "water_park", "wildlife_hide", "user defined"]
    }, {
        "key": "man_made",
        "values": ["adit", "beacon", "breakwater", "bridge", "bunker_silo", "campanile", "chimney", "communications_tower", "crane", "cross", "cutline", "clearcut", "dovecote", "embankment", "dyke",
    "flagpole", "gasometer", "groyne", "kiln", "lighthouse", "mast", "maypole", "mineshaft", "monitoring_station", "obelisk", "observatory", "offshore_platform", "petroleum_well", "pier", "pipeline", "pumping_station", "reservoir_covered", "silo", "snow_fence", "snow_net", "storage_tank", "street_cabinet", "surveillance", "survey_point", "telescope", "tower", "wastewater_plant", "watermill", "water_tower", "water_well", "water_tap", "water_works", "wildlife_crossing", "windmill", "works", "yes", "user defined"]
    }, {
        "key": "natural",
        "values": ["wood", "tree_row", "tree", "scrub", "heath", "moor", "grassland", "fell", "bare_rock", "scree", "shingle", "sand", "mud", "water", "wetland", "glacier", "bay", "cape", "strait", "beach", "coastline", "spring", "hot_spring", "geyser", "reef", "peak", "hill", "volcano", "valley", "river_terrace", "ridge", "arete", "cliff", "saddle", "rock", "stone", "sinkhole", "cave_entrance", "user defined"]
    }, {
        "key": "place",
        "values": ["country", "state", "region", "province", "district", "county", "municipality", "city", "borough", "suburb", "quarter", "neighbourhood", "city_block", "plot", "town", "village", "hamlet", "isolated_dwelling", "farm", "allotments", "continent", "archipelago", "island", "islet", "square", "locality", "sea", "ocean"]
    }, {
        "key": "water",
        "values": ["lake", "river", "pond", "oxbow", "lagoon", "stream_pool", "basin", "reservoir", "canal", "lock", "fish_pass", "reflecting_pool", "moat", "wastewater"]
    }, {
        "key": "building",
        "values": ["yes", "house", "residential"]
    }, {
        "key": "source",
        "values": ["BAG", "Bing", "cadastre-dgi-fr source : Direction Générale des Impôts - Cadastre. Mise à jour : 2010", "cadastre-dgi-fr source : Direction Générale des Impôts - Cadastre. Mise à jour : 2011", "cadastre-dgi-fr source : Direction Générale des Impôts - Cadastre. Mise à jour : 2012", "bing", "NRCan-CanVec-10.0", "YahooJapan/ALPSMAP", "cadastre-dgi-fr source : Direction Générale des Finances Publiques - Cadastre. Mise à jour : 2014", "cadastre-dgi-fr source : Direction Générale des Finances Publiques - Cadastre. Mise à jour : 2013"]
    }, {
        "key": "addr:housenumber",
        "values": ["1", "2", "3", "4", "5", "6", "7", "8", "10", "9"]
    }, {
        "key": "addr:street",
        "values": []
    }, {
        "key": "name",
        "values": []
    }, {
        "key": "addr:city",
        "values": []
    }, {
        "key": "addr:postcode",
        "values": []
    }, {
        "key": "addr:country",
        "values": ["DE", "DK", "CZ", "US", "AT", "RU", "SK", "IT", "EE", "CH"]
    }, {
        "key": "source:date",
        "values": ["2014-03-24", "2014-02-11", "2014-05-07", "2013-11-26", "2014-05-20", "201011", "2018-12-14", "2014-05-24", "2014-01-22", "1989-07-01"]
    }, {
        "key": "surface",
        "values": ["asphalt", "unpaved", "paved", "ground", "gravel", "concrete", "paving_stones", "dirt", "grass", "compacted"]
    }, {
        "key": "power",
        "values": ["tower", "pole", "line", "generator", "substation", "minor_line"]
    }, {
        "key": "waterway",
        "values": ["stream", "ditch", "river", "drain", "canal", "riverbank"]
    }, {
        "key": "start_date",
        "values": ["1970", "1950", "1972", "1975", "1960", "1980", "1973", "1965", "1974", "1955"]
    }, {
        "key": "oneway",
        "values": ["yes", "no"]
    }, {
        "key": "tiger:cfcc",
        "values": ["A41", "A74", "A51", "A31"]
    }, {
        "key": "tiger:county",
        "values": []
    }, {
        "key": "building:levels",
        "values": ["1", "2", "3", "5", "4", "6", "9"]
    }, {
        "key": "wall",
        "values": ["no"]
    }, {
        "key": "tiger:reviewed",
        "values": ["no", "yes"]
    }, {
        "key": "ref",
        "values": ["1"]
    }, {
        "key": "height",
        "values": ["6", "3", "5", "2 m", "4.3", "4.0", "4.5", "4.2", "4.1", "4.4"]
    }, {
        "key": "created_by",
        "values": ["JOSM", "almien_coastlines", "ArcGIS Exporter", "polyshp2osm", "Merkaartor 0.12", "Potlatch 0.10f", "Merkaartor 0.13"]
    }, {
        "key": "maxspeed",
        "values": ["50", "30", "40", "60", "80", "30 mph", "70", "100", "25 mph", "20"]
    }, {
        "key": "ref:bag",
        "values": []
    }, {
        "key": "barrier",
        "values": ["fence", "wall", "gate", "hedge", "bollard", "lift_gate", "retaining_wall", "kerb"]
    }, {
        "key": "service",
        "values": ["driveway", "parking_aisle", "alley", "spur", "yard", "siding"]
    }, {
        "key": "lanes",
        "values": ["2", "1", "3", "4", "5"]
    }, {
        "key": "tiger:name_base",
        "values": []
    }, {
        "key": "access",
        "values": ["private", "yes", "no", "permissive", "customers", "destination", "agricultural", "forestry"]
    }, {
        "key": "addr:place",
        "values": []
    }, {
        "key": "attribution",
        "values": ["Office of Geographic and Environmental Information (MassGIS)", "NHD", "http://wiki.osm.org/wiki/Attribution#LINZ", "GeoBase®", "Natural Resources Canada", "Bakersfield_GIS", "http://www.aucklandcouncil.govt.nz/EN/ratesbuildingproperty/propertyinformation/GIS_maps/Pages/opendata.aspx", "Fresno_County_GIS", "2001 Her Majesty the Queen in Right of Manitoba, as represented by the Minister of Conservation. All rights reserved.", "USFS"]
    }, {
        "key": "source:addr",
        "values": ["emuia.gugik.gov.pl", "EMUiA (emuia.gugik.gov.pl)", "ruian", "EMUiA (emuia.geoportal.gov.pl)", "Maa-amet 2012", "uir_adr", "Durham Open Data", "mapa.um.warszawa.pl", "Maa-amet 2013", "Rennes Métropole"]
    }, {
        "key": "tiger:name_type",
        "values": ["Rd", "St", "Dr", "Ave", "Ln", "Ct", "Cir", "Pl", "Way", "Blvd"]
    }, {
        "key": "type",
        "values": ["multipolygon", "restriction", "route", "boundary", "associatedStreet", "public_transport", "site"]
    }, {
        "key": "ele",
        "values": []
    }, {
        "key": "layer",
        "values": ["1", "-1", "2", "0"]
    }, {
        "key": "tracktype",
        "values": ["grade3", "grade2", "grade4", "grade1", "grade5"]
    }, {
        "key": "addr:suburb",
        "values": []
    }, {
        "key": "addr:state",
        "values": ["MD", "FL", "KY", "NC", "AR", "CA", "VA", "CO", "AZ", "MN"]
    }, {
        "key": "operator",
        "values": ["RTE", "PGL LP", "DB Netz AG", "Enedis", "London Borough of Southwark"]
    }, {
        "key": "tiger:tlid",
        "values": []
    }, {
        "key": "tiger:source",
        "values": ["tiger_import_dch_v0.6_20070829", "tiger_import_dch_v0.6_20070830", "tiger_import_dch_v0.6_20070813", "tiger_import_dch_v0.6_20070809", "tiger_import_dch_v0.6_20070810", "tiger_import_dch_v0.6_20070812", "tiger_import_dch_v0.6_20070828", "tiger_import_dch_v0.6_20070808"]
    }, {
        "key": "foot",
        "values": ["yes", "designated", "no", "permissive"]
    }, {
        "key": "railway",
        "values": ["rail", "level_crossing", "switch", "abandoned", "buffer_stop", "signal", "platform", "crossing", "disused", "station"]
    }, {
        "key": "bicycle",
        "values": ["yes", "no", "designated", "use_sidepath", "dismount", "permissive"]
    }, {
        "key": "tiger:zip_left",
        "values": []
    }, {
        "key": "tiger:upload_uuid",
        "values": []
    }, {
        "key": "bridge",
        "values": ["yes", "viaduct"]
    }, {
        "key": "shop",
        "values": ["convenience", "supermarket", "clothes", "hairdresser", "bakery", "car_repair", "yes", "car", "kiosk", "beauty"]
    }, {
        "key": "tiger:zip_right",
        "values": []
    }, {
        "key": "addr:city:simc",
        "values": ["0918123"]
    }, {
        "key": "yh:WIDTH",
        "values": ["3.0m〜5.5m", "1.5m〜3.0m", "1.5m未満", "5.5m〜13.0m"]
    }, {
        "key": "addr:conscriptionnumber",
        "values": []
    }, {
        "key": "lit",
        "values": ["yes", "no"]
    }, {
        "key": "name:en",
        "values": []
    }, {
        "key": "tiger:separated",
        "values": ["no"]
    }, {
        "key": "note",
        "values": ["National-Land Numerical Information (River) 2006, MLIT Japan", "Ne pas déplacer ce point, cf. - Do not move this node, see - http://wiki.openstreetmap.org/wiki/WikiProject_France/Repères_Géodésiques#Permanence_des_rep.C3.A8res", "National-Land Numerical Information (Public Facility) 2006, MLIT Japan", "National-Land Numerical Information (Lake and Pond) 2005, MLIT Japan", "National-Land Numerical Information (River) 2009, MLIT Japan", "National-Land Numerical Information (Railway) 2007, MLIT Japan", "verificare se man_made=works", "Accurate as of 2010", "Nekonzistence cuzk:km a mvcr:adresa"]
    }, {
        "key": "ref:ruian:building",
        "values": []
    }, {
        "key": "lacounty:bld_id",
        "values": []
    }, {
        "key": "lacounty:ain",
        "values": []
    }, {
        "key": "building:ruian:type",
        "values": ["7", "3", "18", "19", "8", "13", "6", "5", "16", "15"]
    }, {
        "key": "addr:province",
        "values": ["Cavite", "Batangas", "Misamis Oriental", "Zambales", "Bataan", "Nova Scotia", "Leyte", "Ilocos Sur", "Abra", "Metro Manila"]
    }, {
        "key": "building:units",
        "values": ["1", "2", "3", "4"]
    }, {
        "key": "source_ref",
        "values": ["http://wiki.osm.org/wiki/GSI_KIBAN", "http://www.linz.govt.nz/topography/topo-maps/", "http://nlftp.mlit.go.jp/ksj/jpgis/datalist/KsjTmplt-W05.html", "http://nlftp.mlit.go.jp/ksj/jpgis/datalist/KsjTmplt-A13.html", "http://nlftp.mlit.go.jp/ksj/jpgis/datalist/KsjTmplt-P02-v2_0.html", "http://nlftp.mlit.go.jp/ksj/jpgis/datalist/KsjTmplt-W09.html", "http://nlftp.mlit.go.jp/ksj/jpgis/datalist/KsjTmplt-N02-v1_1.html", "http://wiki.openstreetmap.org/wiki/JA:GSI_KIBAN/Using_GSI_KIBAN_WMS"]
    }, {
        "key": "leaf_type",
        "values": ["broadleaved", "needleleaved", "mixed", "broadl-leaved"]
    }, {
        "key": "addr:municipality",
        "values": ["Aarhus", "Aalborg", "København", "Odense", "Vejle", "Esbjerg", "Viborg", "Silkeborg", "Hjørring", "Odsherred"]
    }, {
        "key": "osak:identifier",
        "values": []
    }, {
        "key": "yh:STRUCTURE",
        "values": ["地上", "通常水涯線", "橋"]
    }, {
        "key": "yh:TYPE",
        "values": ["その他一般道", "海岸線", "一般都道府県道", "主要地方道（都道府県道）", "構内道路"]
    }, {
        "key": "roof:shape",
        "values": ["gabled", "flat", "hipped", "pyramidal", "skillion"]
    }, {
        "key": "yh:TOTYUMONO",
        "values": ["供用中"]
    }, {
        "key": "yh:WIDTH_RANK",
        "values": ["3", "4", "5", "2"]
    }, {
        "key": "ref:ruian:addr",
        "values": []
    }, {
        "key": "public_transport",
        "values": ["platform", "stop_position", "stop_area", "station"]
    }, {
        "key": "crossing",
        "values": ["uncontrolled", "zebra", "traffic_signals", "unmarked", "marked", "island"]
    }, {
        "key": "addr:interpolation",
        "values": ["even", "odd"]
    }, {
        "key": "import",
        "values": ["yes", "budovy201004", "budovy201004drev", "freemapkapor"]
    }, {
        "key": "intermittent",
        "values": ["yes", "no"]
    }, {
        "key": "is_in",
        "values": ["Iraq , جمهورية العراق", "Republic of Yemen , جمهورية اليمن", "Elche/Elx, Alicante/Alacant, Comunidad Valenciana, España, Europa", "Saudi Arabia , المملكة العربية السعودية"]
    }, {
        "key": "NHD:FCode",
        "values": ["46003", "46006", "39004", "55800", "46600", "33600", "46007", "39010", "39001"]
    }, {
        "key": "ref:linz:address_id",
        "values": []
    }, {
        "key": "tourism",
        "values": ["information", "hotel", "attraction", "viewpoint", "guest_house", "picnic_site", "artwork", "camp_site", "museum", "hostel"]
    }, {
        "key": "NHD:ComID",
        "values": []
    }, {
        "key": "tunnel",
        "values": ["culvert", "yes", "building_passage", "no"]
    }, {
        "key": "entrance",
        "values": ["yes", "main", "staircase", "home", "service"]
    }, {
        "key": "NHD:ReachCode",
        "values": []
    }, {
        "key": "footway",
        "values": ["sidewalk", "crossing"]
    }, {
        "key": "building:flats",
        "values": ["1", "2", "3", "4", "0"]
    }, {
        "key": "width",
        "values": ["2", "3", "1", "4", "5", "2.5", "1.5", "0.5", "6", "12.2"]
    }, {
        "key": "gauge",
        "values": ["1435", "1520", "1067", "1000", "1676", "1668", "1524"]
    }, {
        "key": "website",
        "values": []
    }, {
        "key": "addr:street:sym_ul",
        "values": ["10898", "20254", "17011", "21970", "03839"]
    }, {
        "key": "NHD:RESOLUTION",
        "values": ["High"]
    }, {
        "key": "sport",
        "values": ["soccer", "tennis", "basketball", "baseball", "multi", "swimming", "golf", "equestrian", "athletics", "running"]
    }, {
        "key": "admin_level",
        "values": ["8", "10", "6", "9", "7", "4", "2", "5"]
    }, {
        "key": "electrified",
        "values": ["contact_line", "no", "rail"]
    }, {
        "key": "source:geometry",
        "values": ["geoportal.gov.pl:BDOT", "geoportal.gov.pl, GPS", "geoportal.gov.pl:ortofoto", "GRB", "Bing", "bing", "Esri World Imagery", "maps4bw (LGL, www.lgl-bw.de); Mapbox Satellite", "Bing 2012", "Maps4BW, LGL, www.lgl-bw.de"]
    }, {
        "key": "leaf_cycle",
        "values": ["deciduous", "evergreen", "mixed", "semi_deciduous", "semi_evergreen"]
    }, {
        "key": "smoothness",
        "values": ["good", "excellent", "intermediate", "bad", "very_bad", "horrible", "very_horrible"]
    }, {
        "key": "voltage",
        "values": ["25000", "15000", "3000", "1500", "110000", "750", "20000", "600", "132000", "220000"]
    }, {
        "key": "wheelchair",
        "values": ["yes", "no", "limited"]
    }, {
        "key": "area",
        "values": ["yes", "no"]
    }, {
        "key": "sidewalk",
        "values": ["both", "no", "none", "right", "left", "separate"]
    }, {
        "key": "opening_hours",
        "values": ["24/7", "Mo-Su 09:00-21:00"]
    }, {
        "key": "bus",
        "values": ["yes"]
    }, {
        "key": "nhd:reach_code",
        "values": []
    }, {
        "key": "source:maxspeed",
        "values": ["sign", "DE:urban", "PL:urban", "IT:urban", "DE:zone30", "FDOT \"Maximum Speed Limits\" GIS data, updated August 27, 2011: http://www.dot.state.fl.us/planning/statistics/gis/roaddata.shtm", "DE:rural", "DE:zone:30", "FR:urban", "AT:urban"]
    }, {
        "key": "network",
        "values": ["lwn", "rwn", "rcn", "NTF-4", "lcn", "S", "VRR", "VOR", "RMV", "ru:regional"]
    }, {
        "key": "phone",
        "values": []
    }, {
        "key": "NHD:way_id",
        "values": []
    }, {
        "key": "description",
        "values": ["Wohnhaus (allgemein)", "Parken (allgemein)", "Annexe", "Gebäude (allgemein)"]
    }, {
        "key": "NHD:FType",
        "values": ["StreamRiver", "ArtificialPath", "CanalDitch"]
    }, {
        "key": "tiger:name_direction_prefix",
        "values": ["N", "E", "W", "S", "SW", "NW", "NE", "SE"]
    }, {
        "key": "fixme",
        "values": ["continue", "Import CTR Veneto. Sostituire con building=stable (stalla) o building=barn (fienile)", "resurvey", "no population estimate available, defaulted to village", "Revisar: este punto fue creado por importación directa", "name", "yes", "Duplicate address in import (zdublowany adres w promieniu 100 metrów; do weryfikacji)", "draw geometry and delete this point", "Duplicate address in import (zdublowany adres w promieniu 100 metrów)"]
    }, {
        "key": "building:material",
        "values": ["cement_block", "brick", "plaster", "wood", "concrete", "metal", "stone", "mud", "steel", "glass"]
    }, {
        "key": "wikidata",
        "values": []
    }, {
        "key": "nhd:com_id",
        "values": []
    }, {
        "key": "parking",
        "values": ["surface", "underground", "multi-storey"]
    }, {
        "key": "emergency",
        "values": ["fire_hydrant", "yes", "phone", "defibrillator", "no", "water_tank"]
    }, {
        "key": "gnis:feature_id",
        "values": []
    }, {
        "key": "tiger:name_base_1",
        "values": []
    }, {
        "key": "mml:class",
        "values": ["36311", "42261", "35412", "42161", "42211", "42231", "34100", "35300", "32611", "36312"]
    }, {
        "key": "religion",
        "values": ["christian", "muslim", "buddhist", "shinto", "hindu"]
    }, {
        "key": "restriction",
        "values": ["no_u_turn", "no_left_turn", "only_straight_on", "no_right_turn", "only_right_turn", "only_left_turn", "no_straight_on"]
    }, {
        "key": "frequency",
        "values": ["50", "0", "16.7", "60", "16.67"]
    }, {
        "key": "wikipedia",
        "values": []
    }, {
        "key": "nycdoitt:bin",
        "values": ["4000000", "3000000"]
    }, {
        "key": "nhd:fdate",
        "values": ["Tue Mar 04 00:00:00 PST 2008", "Sat Apr 05 00:00:00 PDT 2008", "Mon Mar 24 00:00:00 PDT 2008", "Fri May 09 00:00:00 PDT 2008", "Thu Feb 28 00:00:00 PST 2008", "Thu Dec 27 00:00:00 PST 2007", "Thu May 27 00:00:00 PDT 2010", "Fri Mar 08 00:00:00 PST 2002", "Wed May 26 00:00:00 PDT 2010", "Thu Mar 28 00:00:00 PST 2002"]
    }, {
        "key": "source:name",
        "values": ["OS_OpenData_Locator", "Nomenclator Geográfico Básico de España", "IBGE", "GNS", "survey", "OS_OpenData_StreetView", "Red de Nivelación de Alta Precisión", "LPI NSW Base Map", "Nomenclátor Geográfico de Municipios y Entidades de Población", "services.land.vic.gov.au"]
    }, {
        "key": "gnis:fcode",
        "values": ["46003", "46007", "46006", "55800", "39004", "39001", "33600"]
    }, {
        "key": "motor_vehicle",
        "values": ["no", "yes", "private", "destination", "agricultural", "forestry", "designated", "permissive"]
    }, {
        "key": "name:ru",
        "values": []
    }, {
        "key": "gnis:ftype",
        "values": ["StreamRiver", "ArtificialPath", "CanalDitch", "LakePond"]
    }, {
        "key": "species",
        "values": ["Acer platanoides", "Aesculus hippocastanum", "Juglans regia", "Tilia cordata", "Pinus mugo", "Acer pseudoplatanus", "Fraxinus excelsior", "Acer saccharum", "Quercus robur", "Gleditsia triacanthos"]
    }, {
        "key": "usage",
        "values": ["main", "branch", "industrial", "tourism"]
    }, {
        "key": "historic",
        "values": ["memorial", "wayside_cross", "ruins", "archaeological_site", "yes", "wayside_shrine", "monument", "castle", "building", "charcoal_pile"]
    }, {
        "key": "raba:id",
        "values": ["1300", "1500", "1100", "1410", "1222", "2000", "1211", "1800"]
    }, {
        "key": "horse",
        "values": ["no", "yes", "designated", "permissive", "private"]
    }, {
        "key": "alt_name",
        "values": []
    }, {
        "key": "material",
        "values": ["wood", "steel", "metal", "concrete", "stone", "reinforced_concrete", "brick"]
    }, {
        "key": "is_in:state",
        "values": ["California", "León", "Cuenca", "Burgos", "Asturias", "Salamanca", "Guadalajara", "Zamora", "Soria", "Palencia"]
    }, {
        "key": "wetland",
        "values": ["bog", "swamp", "marsh", "reedbed", "wet_meadow", "tidalflat", "mangrove", "saltmarsh"]
    }, {
        "key": "roof:material",
        "values": ["roof_tiles", "tile", "metal", "concrete", "tar_paper", "asbestos", "eternit", "metal sheet", "glass", "slate"]
    }, {
        "key": "name_1",
        "values": []
    }, {
        "key": "building:part",
        "values": ["yes", "roof"]
    }, {
        "key": "denotation",
        "values": ["urban", "avenue", "natural_monument", "landmark", "agricultural", "street"]
    }, {
        "key": "fire_hydrant:type",
        "values": ["underground", "pillar"]
    }, {
        "key": "is_in:country",
        "values": ["United States of America", "Kuwait", "Indonesia", "Spain", "Nigeria", "Iran", "España", "USA", "România", "Ethiopia"]
    }, {
        "key": "shelter",
        "values": ["yes", "no"]
    }, {
        "key": "addr:district",
        "values": ["Усть-Лабинский район", "Лабинский район", "Chittagong", "Narail", "Natore", "Лискинский район", "Fatih", "Arua", "North Lanarkshire"]
    }, {
        "key": "LINZ:source_version",
        "values": ["2012-06-06", "V16"]
    }, {
        "key": "gnis:created",
        "values": ["12/01/2003", "05/19/1980", "11/30/1979", "01/23/1980", "09/01/1992", "06/17/1980", "01/19/1981", "09/25/1979", "08/01/1994", "10/13/1978"]
    }, {
        "key": "cycleway",
        "values": ["lane", "no", "track", "opposite", "shared_lane", "shared", "crossing", "opposite_lane"]
    }, {
        "key": "roof:colour",
        "values": ["grey", "red", "black", "#999999", "gray", "brown", "white", "maroon", "silver", "darkgrey"]
    }, {
        "key": "addr:streetnumber",
        "values": ["1", "3", "4", "2", "5", "6", "7", "8", "10", "9"]
    }, {
        "key": "is_in:state_code",
        "values": ["CA", "24", "16", "9", "33", "37", "19", "49", "42", "34"]
    }, {
        "key": "chicago:building_id",
        "values": []
    }, {
        "key": "gnis:county_id",
        "values": ["031", "005", "003", "001", "013", "017", "037", "009", "019", "025"]
    }, {
        "key": "LINZ:layer",
        "values": ["tree_pnt", "native_poly", "scrub_poly", "cliff_edge", "exotic_poly", "scattered_scrub_poly", "river_cl", "drain_cl", "track_cl", "lake_poly"]
    }, {
        "key": "gnis:state_id",
        "values": ["48", "06", "47", "13", "39", "01", "36", "17", "51", "28"]
    }, {
        "key": "addr:full",
        "values": []
    }, {
        "key": "postal_code",
        "values": ["71019"]
    }, {
        "key": "cuisine",
        "values": ["regional", "pizza", "burger", "italian", "chinese", "coffee_shop", "sandwich", "mexican", "japanese", "indian"]
    }, {
        "key": "LINZ:dataset",
        "values": ["mainland", "lds_geodetic"]
    }, {
        "key": "route",
        "values": ["road", "bus", "hiking", "bicycle", "foot", "ferry", "mtb", "power", "railway", "train"]
    }, {
        "key": "at_bev:addr_date",
        "values": ["2017-10-01", "2017-04-07", "2016-10-02", "2018-04-02", "2018-10-01"]
    }, {
        "key": "NHD:FDate",
        "values": ["2004/12/17", "2005/04/02", "2003/10/01", "2006/05/04", "2005/08/26", "2006/05/17", "2004/11/11", "2006/03/29", "2007/08/08", "2003/10/14"]
    }, {
        "key": "NHD:FTYPE",
        "values": ["LakePond", "SwampMarsh", "StreamRiver", "ArtificialPath", "Reservoir"]
    }, {
        "key": "building:use",
        "values": ["residential", "commercial", "residential;industrial", "car_repair", "industrial", "garage"]
    }, {
        "key": "junction",
        "values": ["roundabout", "yes"]
    }, {
        "key": "source:position",
        "values": ["Bing", "Sentinel-2", "DigitalGlobe Standard", "bing HR(0,0)", "Bing Imagery", "bing HR(0;0)", "Landsat", "MapBox (0,0)", "HiRes aerial imagery", "bing"]
    }, {
        "key": "source:conscriptionnumber",
        "values": ["kapor2"]
    }, {
        "key": "addr:street:name",
        "values": []
    }, {
        "key": "level",
        "values": ["0", "1", "-1", "2", "-2", "3", "-1;0", "0;1"]
    }, {
        "key": "note:ja",
        "values": ["国土数値情報(河川データ)平成18年国土交通省", "国土数値情報（公共施設データ）平成19年　国土交通省", "国土数値情報（湖沼データ）平成17年　国土交通省", "国土数値情報(河川データ)平成21年度 国土交通省", "国土数値情報（鉄道データ）平成19年　国土交通省", "国土数値情報（行政区域データ）平成20年　国土交通省"]
    }, {
        "key": "noexit",
        "values": ["yes", "no"]
    }, {
        "key": "addr:street:type",
        "values": ["Avenue", "Street", "Place", "Road", "Drive", "Boulevard", "Lane", "Court"]
    }, {
        "key": "it:fvg:ctrn:code",
        "values": ["4AED", "4ABA", "4AAF", "4AIN", "4AEL"]
    }, {
        "key": "denomination",
        "values": ["catholic", "roman_catholic", "baptist", "sunni", "orthodox", "lutheran", "protestant", "anglican", "methodist", "russian_orthodox"]
    }, {
        "key": "it:fvg:ctrn:revision",
        "values": ["1A0", "000", "1AN", "1AM"]
    }, {
        "key": "traffic_sign",
        "values": ["city_limit", "maxspeed", "NL:G11", "NL:G12a", "DE:240", "FI:511", "DE:274.1[30]", "NL:G13", "stop", "FI:372"]
    }, {
        "key": "ref:ruian",
        "values": []
    }, {
        "key": "name:ja",
        "values": ["セブン-イレブン"]
    }, {
        "key": "hgv",
        "values": ["designated", "yes", "no", "destination", "delivery", "local"]
    }, {
        "key": "design",
        "values": ["h-frame", "three-level", "delta", "barrel", "triangle", "asymmetric", "monopolar", "flag", "two-level", "donau"]
    }, {
        "key": "lanes:backward",
        "values": ["1", "2", "3", "4"]
    }, {
        "key": "direction",
        "values": ["forward", "backward", "clockwise", "both"]
    }, {
        "key": "genus",
        "values": ["Acer", "Platanus", "Tilia", "Fraxinus", "Aesculus", "Quercus", "Elaeis", "Picea", "Celtis", "Populus"]
    }, {
        "key": "survey:date",
        "values": ["2013", "2013-12-10", "2010"]
    }, {
        "key": "fee",
        "values": ["no", "yes"]
    }, {
        "key": "information",
        "values": ["guidepost", "board", "map", "office", "route_marker", "trail_blaze"]
    }];
}
DlgOSMFilter.prototype = Object.create(DlgTaskBase.prototype);


DlgOSMFilter.prototype.createUI=function(){
  var self=this;
  var info= this.obj;
  if(!info){
    info={};
  }  
  var filterArray=info.filterArray ||[];
  filterArray= JSON.parse(JSON.stringify(filterArray));

  var htm='<div class="scrollable-content" ><form id="'+self.id+'_form" class="modal-body form-horizontal">';  
  htm+='  <p>';
  htm+='Define OSM keys and tags to filter data:';
  htm+='  </p>';
  htm+='  <div class="form-group">';
  htm+='    <label class="" for="key">Key:</label>';
  htm+='    <input id="key" name="key" class="mySearch-searchinput form-control background-position-right" placeholder="Key..." type="search" />';
  htm+='  </div>';
  htm+='  <div class="form-group">';
  htm+='    <label class="" for="tag">Tag:</label>';
  htm+='    <input id="tag" name="tag" class="mySearch-searchinput form-control background-position-right" placeholder="Tag..." type="search" />';
  htm+='  </div>';
  htm+='  <div class="form-group">';
  htm+='    <input type="button" class="btn btn-lg btn-block " id="addFilter" value="Add Filter" />';
  htm+='  </div>';
  var counter=0;
    htm+='<hr />';
    htm+='<div class="form-group">';
    htm+=' <label class="col-sm-12">Filters:</label>';
    htm+=' <table id="tblFilter" class=" table order-list col-sm-12">';
    htm+='  <thead>';
    htm+='  <tr><td>Key</td><td></td><td>Tag</td><td></td></tr>';
    htm+='  </thead>';
    htm+='  <tbody>';
   for(var i=0;i<filterArray.length;i++){
    var key_=filterArray[i]['key'];
    var tag_=filterArray[i]['tag'];
    var operator=filterArray[i]['operator'] || 'eq';
    
    htm+='  <tr>';
    htm += '<td><label class="form-control osm-filter-key" name="key_' + counter + '"  >';
    htm += key_;
    htm += '</label></td>';
    if(tag_){
      htm += '<td>';
      if(operator=='eq'){
        htm += '=';
      }
      htm += '</td>';

      htm += '<td><label class="form-control osm-filter-tag" data-operator="'+ operator+'"  name="tag_' + counter + '"  >';
      htm += tag_;
      htm += '</label></td>';
    }else{
      htm += '<td>Any</td>';
      htm += '<td></td>';
    }
    htm +=' <td><button type="button" class="ibtnDel btn btn-xs btn-danger	"  title="Delete"  style="" ><span class="glyphicon glyphicon-remove"></span> </button></td>';

    htm+='  </tr>';
    counter++;
   }
    htm+='  </tbody>';
    
    htm+='  </table>';
    htm+='</div>';
 

  htm += '</form>';
  htm+='  </div>';
  var content=$(htm).appendTo( this.mainPanel); 
  self.content=content;

  content.find("#addFilter").on("click", function () {
    var key_=content.find('#key').val();
    var tag_=content.find('#tag').val();
    var operator='eq';
    if(!key_){
      return;
    }
      var newRow = $("<tr>");
      var htm = "";

      htm += '<td><label class="form-control osm-filter-key" name="key_' + counter + '"  >';
      htm += key_;
      htm += '</label></td>';
      if(tag_){
        htm += '<td>';
        if(operator=='eq'){
          htm += '=';
        }
        htm += '</td>';
  
        htm += '<td><label class="form-control osm-filter-tag" data-operator="'+ operator+'"  name="tag_' + counter + '"  >';
        htm += tag_;
        htm += '</label></td>';
      }else{
        htm += '<td>Any</td>';
        htm += '<td></td>';
      }
      htm +=' <td><button type="button" class="ibtnDel btn btn-xs btn-danger	"  title="Delete"  style="" ><span class="glyphicon glyphicon-remove"></span> </button></td>';
  
      
      newRow.append(htm);
      content.find("#tblFilter").append(newRow);
      counter++;
  });
  content.find("#tblFilter").on("click", ".ibtnDel", function (event) {
    $(this).closest("tr").remove();       
    counter -= 1
  });
  
  



  var $form = $(content.find('#'+self.id +'_form'));
  $form.on('submit', function(event){
    // prevents refreshing page while pressing enter key in input box
    event.preventDefault();
  });
  this.beforeApplyHandlers.push(function(evt){
    var origIgone= $.validator.defaults.ignore;
    $.validator.setDefaults({ ignore:'' });
    $.validator.unobtrusive.parse($form);
    $.validator.setDefaults({ ignore:origIgone });

    $form.validate();
    if(! $form.valid()){
      evt.cancel= true;
      var errElm=$form.find('.input-validation-error').first();
      if(errElm){
        var offset=errElm.offset().top;
        //var tabOffset= tabHeader.offset().top;
        var tabOffset=0;
        //tabOffset=self.mainPanel.offset().top;
        tabOffset=$form.offset().top;
        self.mainPanel.find('.scrollable-content').animate({
              scrollTop: offset - tabOffset //-60//-160
            }, 1000);
    
      }
    }
  });

  this.applyHandlers.push(function(evt){
   
      var filterArray=[];
      
      var keys={};
      content.find('#tblFilter > tbody  > tr').each(function() {
        var key=$(this).find('.osm-filter-key').text();
        var tag=$(this).find('.osm-filter-tag').text();
        var operator=$(this).find('.osm-filter-tag').data('operator');
        
        filterArray.push({
            key:key,
            tag: tag,
            operator:operator
          }) ;
        
      });
      evt.data.filterArray=filterArray;
  });
  var keyEl= content.find('#key');
   keyEl.change(function(){
    createTagList();
  })
  $(keyEl).autocomplete({
    appendTo:content,
    minLength: 0,
    source: function (request, response) {
        var term = request.term;
        var matcher = new RegExp( $.ui.autocomplete.escapeRegex(request.term), "i" );
        var text = $( this ).text();
        var mappedData=$.map(self.keys, function (item) {
          if ( item.key && ( !request.term || matcher.test(item.key) ) ){
                return {
                    label: item.key,
                    value: item.key,
                    data:item.values
                };
          }
        })
        response(mappedData);
        return;
  
    },
    select: function (event, ui) {
        $(this).val(ui.item.label);
       // showResults(ui.item);
       
      //  if(!self.layer.get('title') && ui.item.data ){
      //    $('#'+LayerGeneralTab.TabId+'_form').find('#name').val(ui.item.data.title ||ui.item.data.label);
      //  }
      createTagList();
        return false;
    },
    focus: function (event, ui) {
        //commentes 2016/05/03
      //  $(this).val(ui.item.label);
    
        return false;
    },
    open: function() {
        $("ul.ui-menu").width($(this).innerWidth());
    }
})
 .focus(function (event, ui) {
      $(this).autocomplete("search");
 }).data("ui-autocomplete")._renderItem = function (ul, item) {
   var label = item.label;
   var term = this.term;
   if (term) {
      label = String(label).replace( new RegExp(term, "gi"),
           "<strong class='ui-state-highlight'>$&</strong>");
   }
   var class_ =  '';
   var htm = '';
   htm += '<div class="' + class_ + '" >';
   htm += '<strong>'+label+'</strong>' ;
    return $("<li></li>").append(htm).appendTo(ul);
  
};
var createTagList=function(){
  var keyEl= content.find('#key');  
  var key=keyEl.val();
  var values=[];
  for(var i=0;i<self.keys.length;i++){
    if(self.keys[i].key==key){
      values= self.keys[i].values;
      break;
    }
  }
  
  var tagEl= content.find('#tag');
  tagEl.val(undefined);
    $(tagEl).autocomplete({
      appendTo:content,
      minLength: 0,
      source: function (request, response) {
          var term = request.term;
          var matcher = new RegExp( $.ui.autocomplete.escapeRegex(request.term), "i" );
          var text = $( this ).text();
          var mappedData=$.map(values, function (item) {
            if ( item && ( !request.term || matcher.test(item) ) ){
                  return {
                      label: item,
                      value: item
                  };
            }
          })
          response(mappedData);
          return;
    
      },
      select: function (event, ui) {
          $(this).val(ui.item.label);
        // showResults(ui.item);
        
        //  if(!self.layer.get('title') && ui.item.data ){
        //    $('#'+LayerGeneralTab.TabId+'_form').find('#name').val(ui.item.data.title ||ui.item.data.label);
        //  }
          return false;
      },
      focus: function (event, ui) {
          //commentes 2016/05/03
        //  $(this).val(ui.item.label);
      
          return false;
      },
      open: function() {
          $("ul.ui-menu").width($(this).innerWidth());
      }
  })
  .focus(function (event, ui) {
        $(this).autocomplete("search");
  }).data("ui-autocomplete")._renderItem = function (ul, item) {
    
    var label = item.label;
    var term = this.term;
    if (term) {
        label = String(label).replace( new RegExp(term, "gi"),
            "<strong class='ui-state-highlight'>$&</strong>");
    }
    var class_ =  '';
    var htm = '';
    htm += '<div class="' + class_ + '" >';
    htm += '<strong>'+label+'</strong>' ;
      return $("<li></li>").append(htm).appendTo(ul);
    
  };
}
  this.changesApplied=false
}
