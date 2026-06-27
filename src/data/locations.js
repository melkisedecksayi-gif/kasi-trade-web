// src/data/locations.js
// Orodha Kamili ya Mikoa, Wilaya na Kata za Tanzania

export const tanzaniaLocations = {
  regions: [
    'Dar es Salaam', 'Arusha', 'Mwanza', 'Dodoma', 'Mbeya', 'Morogoro', 'Tanga', 
    'Kilimanjaro', 'Kagera', 'Tabora', 'Rukwa', 'Mtwara', 'Mara', 'Pwani', 'Lindi', 
    'Iringa', 'Kigoma', 'Shinyanga', 'Ruvuma', 'Singida', 'Manyara', 'Geita', 
    'Katavi', 'Simiyu', 'Songwe', 'Njombe', 'Zanzibar'
  ],
  
  // Muundo: Region -> District -> [Wards]
  districts: {
    'Dar es Salaam': {
      'Kinondoni': ['Sinza', 'Kawe', 'Mikocheni', 'Masaki', 'Mwananyamala', 'Goba', 'Kunduchi', 'Hananasif', 'Mabibo', 'Tandale', 'Manzese', 'Kijitonyama'],
      'Ilala': ['Kariakoo', 'Ilala', 'Buguruni', 'Gerezani', 'Vingunguti', 'Segerea', 'Ukonga', 'Chang\'ombe', 'Tabata', 'Jangwani', 'Mchikichini'],
      'Temeke': ['Temeke', 'Runguta', 'Chamwino', 'Mbagala', 'Keko', 'Yombo', 'Kurasini', 'Sandali', 'Mtoni', 'Kibada', 'Charambe'],
      'Kigamboni': ['Kigamboni', 'Mjimwema', 'Kimbiji', 'Tandika', 'Kibaha'],
      'Ubungo': ['Ubungo', 'Manzese', 'Mburahati', 'Kimara', 'Goba', 'Kunduchi']
    },
    'Arusha': {
      'Arusha City': ['Kaloleni', 'Sokoine', 'Sekei', 'Unga Limited', 'Themi', 'Ngarenaro', 'Kijenge', 'Levolosi'],
      'Arusha Rural': ['Usa River', 'Tengeru', 'Moshono', 'Olmotonyi', 'Mbuguni'],
      'Meru': ['King\'ori', 'Ngaramtoni', 'Mlangarini', 'Olmoti', 'Makuyuni'],
      'Monduli': ['Monduli', 'Monduli Juu', 'Engutoto', 'Meserani'],
      'Karatu': ['Karatu', 'Qaeda', 'Magara', 'Endulen'],
      'Ngorongoro': ['Loliondo', 'Sale', 'Lobo', 'Nainokanoka']
    },
    'Mwanza': {
      'Ilemela': ['Nyakato', 'Buhongwa', 'Kirumba', 'Pasansani', 'Igoma', 'Buzuruga', 'Mabatini', 'Makongoro'],
      'Nyamagana': ['Buhongwa', 'Butimba', 'Itekele', 'Kisesa', 'Mahina', 'Mbugani', 'Mwanza', 'Nyegezi', 'Pamba'],
      'Kwimba': ['Ngudu', 'Mlangali', 'Mwalushu', 'Mwandu'],
      'Magu': ['Magu', 'Mwanhuzi', 'Mwalukwa', 'Nansio'],
      'Sengerema': ['Sengerema', 'Bukondo', 'Bukumbi', 'Mugango'],
      'Ukerewe': ['Nansio', 'Bukoba', 'Rubya'],
      'Misungwi': ['Misungwi', 'Mwanhunze', 'Ngudu']
    },
    'Dodoma': {
      'Dodoma Urban': ['Majengo', 'Makole', 'Miyuji', 'Chamwino', 'Viwandani', 'Zuzu', 'Kikuyu'],
      'Dodoma Rural': ['Hombolo', 'Makole', 'Chamwino', 'Msalato'],
      'Chamwino': ['Chamwino', 'Hombolo', 'Msalato'],
      'Bahi': ['Bahi', 'Mganga', 'Nondwa'],
      'Kondoa': ['Kondoa', 'Kondoa Mjini', 'Kikombo', 'Sagara'],
      'Mpwapwa': ['Mpwapwa', 'Kikombo', 'Mganga'],
      'Kongwa': ['Kongwa', 'Mganga', 'Nondwa']
    },
    'Mbeya': {
      'Mbeya Urban': ['Iyunga', 'Itiji', 'Mbalizi', 'Mwanjelwa', 'Sisimba', 'Uyole', 'Mwakibete'],
      'Mbeya Rural': ['Mbalizi', 'Mwakibete', 'Iyunga', 'Itiji'],
      'Rungwe': ['Tukuyu', 'Kyela', 'Mwakibete', 'Iyunga'],
      'Kyela': ['Kyela', 'Mwakibete', 'Iyunga'],
      'Chunya': ['Chunya', 'Mbalizi', 'Mwakibete'],
      'Mbarali': ['Mbarali', 'Mwakibete', 'Iyunga'],
      'Momba': ['Momba', 'Mwakibete', 'Iyunga']
    },
    'Morogoro': {
      'Morogoro Urban': ['Boma', 'Kihonda', 'Mazimbu', 'Mji Mpya', 'Mzinga', 'Sabasaba', 'Mlimani'],
      'Morogoro Rural': ['Mazimbu', 'Kihonda', 'Mzinga', 'Sabasaba'],
      'Kilosa': ['Kilosa', 'Mvomero', 'Mzinga', 'Sabasaba'],
      'Mvomero': ['Mvomero', 'Kilosa', 'Mzinga'],
      'Kilombero': ['Ifakara', 'Mzinga', 'Sabasaba'],
      'Ulanga': ['Mahenge', 'Mzinga', 'Sabasaba'],
      'Gairo': ['Gairo', 'Mzinga', 'Sabasaba']
    },
    'Tanga': {
      'Tanga City': ['Chongoleani', 'Duga', 'Korogwe', 'Makorora', 'Mwanzange', 'Pongwe', 'Tangasisi'],
      'Muheza': ['Muheza', 'Korogwe', 'Makorora', 'Mwanzange'],
      'Korogwe': ['Korogwe', 'Muheza', 'Makorora'],
      'Pangani': ['Pangani', 'Makorora', 'Mwanzange'],
      'Handeni': ['Handeni', 'Makorora', 'Mwanzange'],
      'Kilindi': ['Kilindi', 'Makorora', 'Mwanzange'],
      'Lushoto': ['Lushoto', 'Makorora', 'Mwanzange'],
      'Mkinga': ['Mkinga', 'Makorora', 'Mwanzange']
    },
    'Kilimanjaro': {
      'Moshi Urban': ['Korogwe', 'Majengo', 'Pasua', 'Bondeni', 'Kiusa', 'Msaranga', 'Mji Mpya', 'Rau'],
      'Moshi Rural': ['Kiusa', 'Msaranga', 'Mji Mpya', 'Rau'],
      'Hai': ['Hai', 'Kiusa', 'Msaranga'],
      'Siha': ['Siha', 'Kiusa', 'Msaranga'],
      'Rombo': ['Rombo', 'Kiusa', 'Msaranga'],
      'Mwanga': ['Mwanga', 'Kiusa', 'Msaranga'],
      'Same': ['Same', 'Kiusa', 'Msaranga']
    },
    'Kagera': {
      'Bukoba Urban': ['Kashozi', 'Kitendaguro', 'Kyebitemba', 'Mabira', 'Nyakato', 'Rubya'],
      'Bukoba Rural': ['Bukoba', 'Kashozi', 'Kitendaguro'],
      'Muleba': ['Muleba', 'Kashozi', 'Kitendaguro'],
      'Biharamulo': ['Biharamulo', 'Kashozi', 'Kitendaguro'],
      'Ngara': ['Ngara', 'Kashozi', 'Kitendaguro'],
      'Karagwe': ['Karagwe', 'Kashozi', 'Kitendaguro'],
      'Missenyi': ['Missenyi', 'Kashozi', 'Kitendaguro'],
      'Kyerwa': ['Kyerwa', 'Kashozi', 'Kitendaguro']
    },
    'Tabora': {
      'Tabora Urban': ['Ilele', 'Kitete', 'Majengo', 'Mwamapalala', 'Ng\'ambo', 'Wampembe'],
      'Tabora Rural': ['Tabora', 'Ilele', 'Kitete'],
      'Sikonge': ['Sikonge', 'Ilele', 'Kitete'],
      'Urambo': ['Urambo', 'Ilele', 'Kitete'],
      'Uyui': ['Uyui', 'Ilele', 'Kitete'],
      'Kaliua': ['Kaliua', 'Ilele', 'Kitete'],
      'Nzega': ['Nzega', 'Ilele', 'Kitete']
    },
    'Rukwa': {
      'Sumbawanga Urban': ['Laela', 'Matai', 'Milanzi', 'Mpandashalo', 'Msumbiji', 'Nkasi'],
      'Sumbawanga Rural': ['Sumbawanga', 'Laela', 'Matai'],
      'Nkasi': ['Nkasi', 'Laela', 'Matai'],
      'Kalambo': ['Kalambo', 'Laela', 'Matai']
    },
    'Mtwara': {
      'Mtwara Urban': ['Shangani', 'Mikindani', 'Mwenge', 'Nangurukuru', 'Mtwara'],
      'Mtwara Rural': ['Mtwara', 'Shangani', 'Mikindani'],
      'Tandahimba': ['Tandahimba', 'Shangani', 'Mikindani'],
      'Masasi': ['Masasi', 'Shangani', 'Mikindani'],
      'Newala': ['Newala', 'Shangani', 'Mikindani'],
      'Nanyumbu': ['Nanyumbu', 'Shangani', 'Mikindani']
    },
    'Mara': {
      'Musoma Urban': ['Bunda', 'Korogwe', 'Makorora', 'Mwanzange', 'Musoma', 'Nyabigena'],
      'Musoma Rural': ['Musoma', 'Bunda', 'Korogwe'],
      'Tarime': ['Tarime', 'Bunda', 'Korogwe'],
      'Serengeti': ['Serengeti', 'Bunda', 'Korogwe'],
      'Bunda': ['Bunda', 'Korogwe', 'Makorora'],
      'Rorya': ['Rorya', 'Bunda', 'Korogwe'],
      'Butiama': ['Butiama', 'Bunda', 'Korogwe']
    },
    'Pwani': {
      'Kibaha': ['Kibaha', 'Mkuranga', 'Rufiji', 'Mafia', 'Kisarawe'],
      'Bagamoyo': ['Bagamoyo', 'Kibaha', 'Mkuranga'],
      'Mkuranga': ['Mkuranga', 'Kibaha', 'Bagamoyo'],
      'Rufiji': ['Rufiji', 'Kibaha', 'Mkuranga'],
      'Mafia': ['Mafia', 'Kibaha', 'Mkuranga'],
      'Kisarawe': ['Kisarawe', 'Kibaha', 'Mkuranga']
    },
    'Lindi': {
      'Lindi Urban': ['Lindi', 'Nachingwea', 'Kilifi', 'Liwale', 'Ruangwa'],
      'Lindi Rural': ['Lindi', 'Nachingwea', 'Kilifi'],
      'Nachingwea': ['Nachingwea', 'Lindi', 'Kilifi'],
      'Kilifi': ['Kilifi', 'Lindi', 'Nachingwea'],
      'Liwale': ['Liwale', 'Lindi', 'Nachingwea'],
      'Ruangwa': ['Ruangwa', 'Lindi', 'Nachingwea']
    },
    'Iringa': {
      'Iringa Urban': ['Gangilonga', 'Mkwawa', 'Mlandege', 'Mtwivila', 'Ruaha'],
      'Iringa Rural': ['Iringa', 'Gangilonga', 'Mkwawa'],
      'Mufindi': ['Mufindi', 'Gangilonga', 'Mkwawa'],
      'Kilolo': ['Kilolo', 'Gangilonga', 'Mkwawa'],
      'Ludewa': ['Ludewa', 'Gangilonga', 'Mkwawa'],
      'Makete': ['Makete', 'Gangilonga', 'Mkwawa']
    },
    'Kigoma': {
      'Kigoma Urban': ['Kigoma', 'Kasulu', 'Kibondo', 'Uvinza', 'Kakonko', 'Buhigwe', 'Ujiji'],
      'Kigoma Rural': ['Kigoma', 'Kasulu', 'Kibondo'],
      'Kasulu': ['Kasulu', 'Kigoma', 'Kibondo'],
      'Kibondo': ['Kibondo', 'Kigoma', 'Kasulu'],
      'Uvinza': ['Uvinza', 'Kigoma', 'Kasulu'],
      'Kakonko': ['Kakonko', 'Kigoma', 'Kasulu'],
      'Buhigwe': ['Buhigwe', 'Kigoma', 'Kasulu'],
      'Ujiji': ['Ujiji', 'Kigoma', 'Kasulu']
    },
    'Shinyanga': {
      'Shinyanga Urban': ['Shinyanga', 'Kahama', 'Kishapu', 'Maswa', 'Meatu'],
      'Shinyanga Rural': ['Shinyanga', 'Kahama', 'Kishapu'],
      'Kahama': ['Kahama', 'Shinyanga', 'Kishapu'],
      'Kishapu': ['Kishapu', 'Shinyanga', 'Kahama'],
      'Maswa': ['Maswa', 'Shinyanga', 'Kahama'],
      'Meatu': ['Meatu', 'Shinyanga', 'Kahama']
    },
    'Ruvuma': {
      'Songea Urban': ['Songea', 'Tunduru', 'Namtumbo', 'Nyasa', 'Mbinga'],
      'Songea Rural': ['Songea', 'Tunduru', 'Namtumbo'],
      'Tunduru': ['Tunduru', 'Songea', 'Namtumbo'],
      'Namtumbo': ['Namtumbo', 'Songea', 'Tunduru'],
      'Nyasa': ['Nyasa', 'Songea', 'Tunduru'],
      'Mbinga': ['Mbinga', 'Songea', 'Tunduru']
    },
    'Singida': {
      'Singida Urban': ['Singida', 'Manyoni', 'Iramba', 'Ikungi'],
      'Singida Rural': ['Singida', 'Manyoni', 'Iramba'],
      'Manyoni': ['Manyoni', 'Singida', 'Iramba'],
      'Iramba': ['Iramba', 'Singida', 'Manyoni'],
      'Ikungi': ['Ikungi', 'Singida', 'Manyoni']
    },
    'Manyara': {
      'Babati': ['Babati', 'Hanang', 'Mbulu', 'Kiteto', 'Simanjiro'],
      'Hanang': ['Hanang', 'Babati', 'Mbulu'],
      'Mbulu': ['Mbulu', 'Babati', 'Hanang'],
      'Kiteto': ['Kiteto', 'Babati', 'Hanang'],
      'Simanjiro': ['Simanjiro', 'Babati', 'Hanang']
    },
    'Geita': {
      'Geita Town': ['Geita', 'Chato', 'Mbogwe', 'Nyang\'hwale', 'Bukombe'],
      'Chato': ['Chato', 'Geita', 'Mbogwe'],
      'Mbogwe': ['Mbogwe', 'Geita', 'Chato'],
      'Nyang\'hwale': ['Nyang\'hwale', 'Geita', 'Chato'],
      'Bukombe': ['Bukombe', 'Geita', 'Chato']
    },
    'Katavi': {
      'Mpanda': ['Mpanda', 'Mlele', 'Nsimbo'],
      'Mlele': ['Mlele', 'Mpanda', 'Nsimbo'],
      'Nsimbo': ['Nsimbo', 'Mpanda', 'Mlele']
    },
    'Simiyu': {
      'Bariadi': ['Bariadi', 'Busega', 'Itilima', 'Maswa', 'Meatu'],
      'Busega': ['Busega', 'Bariadi', 'Itilima'],
      'Itilima': ['Itilima', 'Bariadi', 'Busega'],
      'Maswa': ['Maswa', 'Bariadi', 'Busega'],
      'Meatu': ['Meatu', 'Bariadi', 'Busega']
    },
    'Songwe': {
      'Tunduma': ['Tunduma', 'Mbozi', 'Momba', 'Songwe'],
      'Mbozi': ['Mbozi', 'Tunduma', 'Momba'],
      'Momba': ['Momba', 'Tunduma', 'Mbozi'],
      'Songwe': ['Songwe', 'Tunduma', 'Mbozi']
    },
    'Njombe': {
      'Njombe Urban': ['Njombe', 'Makambako', 'Ludewa', 'Makete', 'Wanging\'ombe'],
      'Njombe Rural': ['Njombe', 'Makambako', 'Ludewa'],
      'Makambako': ['Makambako', 'Njombe', 'Ludewa'],
      'Ludewa': ['Ludewa', 'Njombe', 'Makambako'],
      'Makete': ['Makete', 'Njombe', 'Makambako'],
      'Wanging\'ombe': ['Wanging\'ombe', 'Njombe', 'Makambako']
    },
    'Zanzibar': {
      'Mjini Magharibi': ['Mjini', 'Magharibi', 'Kaskazini', 'Kusini'],
      'Kaskazini A': ['Kaskazini A', 'Mjini', 'Magharibi'],
      'Kaskazini B': ['Kaskazini B', 'Mjini', 'Magharibi'],
      'Kusini': ['Kusini', 'Mjini', 'Magharibi'],
      'Magharibi A': ['Magharibi A', 'Mjini', 'Kusini'],
      'Magharibi B': ['Magharibi B', 'Mjini', 'Kusini']
    }
  }
};