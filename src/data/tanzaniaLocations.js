const tanzania = {
  "Arusha": ["Arusha City", "Arusha Rural", "Karatu", "Longido", "Monduli", "Meru", "Ngorongoro"],
  "Dar es Salaam": ["Ilala", "Kinondoni", "Temeke", "Kigamboni", "Ubungo"],
  "Dodoma": ["Dodoma City", "Bahi", "Chamwino", "Chemba", "Kondoa", "Kongwa", "Mpwapwa"],
  "Geita": ["Geita Town", "Bukombe", "Chato", "Mbogwe", "Nyang'hwale"],
  "Iringa": ["Iringa Urban", "Iringa Rural", "Kilolo", "Mafinga", "Mufindi"],
  "Kagera": ["Bukoba Urban", "Bukoba Rural", "Biharamulo", "Karagwe", "Kyerwa", "Missenyi", "Muleba", "Ngara"],
  "Katavi": ["Mpanda", "Mlele", "Mpimbwe", "Nsimbo"],
  "Kigoma": ["Kigoma Urban", "Kigoma Rural", "Buhigwe", "Kakonko", "Kasulu", "Kibondo", "Uvinza"],
  "Kilimanjaro": ["Moshi Urban", "Moshi Rural", "Hai", "Mwanga", "Rombo", "Same", "Siha"],
  "Lindi": ["Lindi Urban", "Lindi Rural", "Kilwa", "Liwale", "Nachingwea", "Ruangwa"],
  "Manyara": ["Babati", "Hanang", "Kiteto", "Mbulu", "Simanjiro"],
  "Mara": ["Musoma Urban", "Musoma Rural", "Bunda", "Butiama", "Rorya", "Serengeti", "Tarime"],
  "Mbeya": ["Mbeya City", "Busokelo", "Chunya", "Kyela", "Mbarali", "Mbeya Rural", "Rungwe"],
  "Mjini Magharibi": ["Magharibi", "Mjini"],
  "Morogoro": ["Morogoro Urban", "Morogoro Rural", "Gairo", "Kilombero", "Kilosa", "Malinyi", "Mvomero", "Ulanga"],
  "Mtwara": ["Mtwara Urban", "Mtwara Rural", "Masasi", "Nanyumbu", "Newala", "Tandahimba"],
  "Mwanza": ["Ilemela", "Nyamagana", "Buchosa", "Kwimba", "Magu", "Misungwi", "Sengerema", "Ukerewe"],
  "Njombe": ["Njombe Town", "Ludewa", "Makambako", "Makete", "Njombe Rural", "Wanging'ombe"],
  "Pemba Kaskazini": ["Micheweni", "Wete"],
  "Pemba Kusini": ["Chake Chake", "Mkoani"],
  "Pwani": ["Kibaha", "Bagamoyo", "Chalinze", "Kibiti", "Kisarawe", "Mafia", "Mkuranga", "Rufiji"],
  "Rukwa": ["Sumbawanga Urban", "Sumbawanga Rural", "Kalambo", "Nkasi"],
  "Ruvuma": ["Songea Urban", "Songea Rural", "Madaba", "Mbinga", "Namtumbo", "Nyasa", "Tunduru"],
  "Shinyanga": ["Shinyanga Urban", "Shinyanga Rural", "Kahama Urban", "Kahama Rural", "Kishapu", "Msalala", "Ushetu"],
  "Simiyu": ["Bariadi", "Busega", "Itilima", "Maswa", "Meatu"],
  "Singida": ["Singida Urban", "Singida Rural", "Ikungi", "Iramba", "Itigi", "Manyoni", "Mkalama"],
  "Songwe": ["Tunduma", "Ileje", "Mbozi", "Momba", "Songwe"],
  "Tabora": ["Tabora Urban", "Tabora Rural", "Igunga", "Kaliua", "Nzega", "Sikonge", "Urambo", "Uyui"],
  "Tanga": ["Tanga City", "Handeni", "Korogwe", "Kilindi", "Lushoto", "Mkinga", "Muheza", "Pangani"],
  "Unguja Kaskazini": ["Kaskazini A", "Kaskazini B"],
  "Unguja Kusini": ["Kati", "Kusini"],
};

export const REGIONS = Object.keys(tanzania).sort();

export const DISTRICTS_BY_REGION = tanzania;

export const ALL_DISTRICTS = Object.values(tanzania).flat().sort();
