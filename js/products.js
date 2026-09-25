/* ============================================================
   REC — Products / categories data layer
   Reads from Supabase when configured; falls back to bundled
   demo catalogue so the UI is fully browsable during development.
   ============================================================ */
(function (win) {
  "use strict";
  const REC = (win.REC = win.REC || {});
  const UI = REC.ui;
  const sb = () => REC.supabaseClient;

  /* ---------- Offline/demo data (clearly sample, replaced by admin) ---------- */
  const DEMO_CATEGORIES = [
    { id: 1, slug: "poultry", name: "Poultry", image: "assets/images/broiler-chick.jpg", description: "Broilers, layers, cockerels, day-old chicks, turkeys, ducks & more." },
    { id: 2, slug: "eggs", name: "Eggs", image: "assets/images/eggs.jpg", description: "Table eggs, fertile eggs and hatching eggs." },
    { id: 3, slug: "livestock", name: "Livestock", image: "assets/images/goat.png", description: "Goats, rams, sheep, cattle and pigs." },
    { id: 4, slug: "fish", name: "Fish", image: "assets/images/category-fish.svg", description: "Catfish, tilapia and fingerlings." },
    { id: 5, slug: "farm-supplies", name: "Farm Supplies", image: "assets/images/category-supplies.svg", description: "Feed, vitamins and farm equipment." },
  ];

  const PLACEHOLDER = "assets/images/placeholder-product.svg";

  const DEMO_PRODUCTS = [
    { id: "d1", category_id: 1, category_slug: "poultry", name: "Day-old Broiler Chicks", description: "Healthy, fast-growing day-old broiler chicks from well-managed parent stock. Ideal for commercial and backyard broiler production.", price: 42500, unit: "per 50 chicks", image: "assets/images/broiler-chick.jpg", stock_quantity: 24, minimum_order_quantity: 1, online_orderable: true, featured: true, active: true, breed: "Broiler (Cobb/Arbor Acres)", age: "Day-old", sex: "Straight run", delivery_info: "Carefully packed for nationwide delivery." },
    { id: "d2", category_id: 1, category_slug: "poultry", name: "Day-old Layer Chicks", description: "High-yield layer chicks raised for excellent egg production and strong liveability.", price: 40000, unit: "per 50 chicks", image: "assets/images/broiler-chick.jpg", stock_quantity: 18, minimum_order_quantity: 1, online_orderable: true, featured: true, active: true, breed: "Layer (Isa Brown)", age: "Day-old", sex: "Female", delivery_info: "Available for nationwide delivery." },
    { id: "d3", category_id: 5, category_slug: "farm-supplies", name: "Poultry Feed (Top Feed)", description: "Balanced, high-quality poultry feed for broilers and layers at every growth stage.", price: 12500, unit: "per 25kg bag", image: "assets/images/category-supplies.svg", stock_quantity: 220, minimum_order_quantity: 1, online_orderable: true, featured: true, active: true },
    { id: "d4", category_id: 4, category_slug: "fish", name: "Fresh Tilapia", description: "Freshly harvested tilapia from clean, well-managed ponds.", price: 2500, unit: "per kg", image: "assets/images/category-fish.svg", stock_quantity: 0, minimum_order_quantity: 2, online_orderable: true, featured: true, active: true },
    { id: "d5", category_id: 3, category_slug: "livestock", name: "Goat (Red Sokoto)", description: "Healthy goats for breeding or household use.", price: 85000, unit: "per goat", image: "assets/images/goat.png", stock_quantity: 14, minimum_order_quantity: 1, online_orderable: true, featured: true, active: true, breed: "Red Sokoto", age: "6–12 months", sex: "Mixed", weight: "15–25 kg", delivery_info: "Farm pickup or arranged delivery." },
    { id: "d6", category_id: 2, category_slug: "eggs", name: "Table Eggs (Crate)", description: "Fresh, clean table eggs collected daily from healthy layers.", price: 6500, unit: "per crate (30)", image: "assets/images/eggs.jpg", stock_quantity: 60, minimum_order_quantity: 1, online_orderable: true, featured: true, active: true },
    { id: "d7", category_id: 2, category_slug: "eggs", name: "Hatching Eggs", description: "Fertile eggs for incubation from proven parent stock.", price: 950, unit: "per egg", image: "assets/images/eggs.jpg", stock_quantity: 0, minimum_order_quantity: 30, online_orderable: true, active: false },
    { id: "d8", category_id: 1, category_slug: "poultry", name: "Broilers Meat (Visit Farm)", description: "Fresh broiler meat — currently available for purchase directly at the farm location.", price: 7500, unit: "per bird", image: "assets/images/fowl-local.png", stock_quantity: 40, minimum_order_quantity: 1, online_orderable: false, featured: false, active: true, delivery_info: "Visit the farm to purchase." },
    { id: "d9", category_id: 3, category_slug: "livestock", name: "Pigs (Visit Farm)", description: "Healthy pigs — currently available for purchase directly at the farm location.", price: 65000, unit: "per pig", image: "assets/images/placeholder-product.svg", stock_quantity: 8, minimum_order_quantity: 1, online_orderable: false, featured: false, active: true, delivery_info: "Visit the farm to purchase." },
    { id: "d10", category_id: 4, category_slug: "fish", name: "Catfish (Live)", description: "Live, healthy catfish ready for delivery or pickup.", price: 3200, unit: "per kg", image: "assets/images/category-fish.svg", stock_quantity: 150, minimum_order_quantity: 2, online_orderable: true, featured: false, active: true },
    { id: "d11", category_id: 5, category_slug: "farm-supplies", name: "Fish Feed", description: "Quality floating fish feed for growth and health.", price: 16500, unit: "per 15kg bag", image: "assets/images/category-supplies.svg", stock_quantity: 80, minimum_order_quantity: 1, online_orderable: true, active: true },
    { id: "d13", category_id: 1, category_slug: "poultry", name: "Turkey (Live)", description: "Healthy, well-fed turkeys for rearing, slaughter or festive seasons. Order ahead to reserve yours.", price: 45000, unit: "per turkey", image: "assets/images/turkey.png", stock_quantity: 25, minimum_order_quantity: 1, online_orderable: true, featured: false, active: true, breed: "Turkey (Broad-breasted White)", age: "Mature", delivery_info: "Available for nationwide delivery." },
    { id: "d14", category_id: 1, category_slug: "poultry", name: "Israel Fowl (Live)", description: "Strong, fast-growing Israel fowls for meat or breeding. Raised with proper feeding and care.", price: 25000, unit: "per fowl", image: "assets/images/fowl-israel.png", stock_quantity: 30, minimum_order_quantity: 1, online_orderable: true, featured: false, active: true, breed: "Israel Fowl", age: "Mature", sex: "Mixed", delivery_info: "Available for nationwide delivery." },
    { id: "d15", category_id: 1, category_slug: "poultry", name: "Local Fowl (Free-range)", description: "Free-range local fowls raised on the farm — hardy birds, great for traditional recipes.", price: 15000, unit: "per fowl", image: "assets/images/fowl-local.png", stock_quantity: 40, minimum_order_quantity: 1, online_orderable: true, featured: false, active: true, breed: "Local (Free-range)", age: "Mature", sex: "Mixed", delivery_info: "Available for nationwide delivery." },
  ];

  const DEMO_TESTIMONIALS = [
    { id: "t1", name: "Adaeze O.", location: "Umuahia, Abia", message: "Sample testimonial — the day-old chicks arrived healthy and on time. Great service.", rating: 5, sample: true },
    { id: "t2", name: "Chinedu E.", location: "Owerri, Imo", message: "Sample testimonial — reliable farm supplies and fair prices. Recommended.", rating: 5, sample: true },
    { id: "t3", name: "Fatima B.", location: "Kano", message: "Sample testimonial — table eggs delivered fresh every week. Thank you REC.", rating: 4, sample: true },
  ];

  const DEMO_BLOG = [
    { id: "b1", slug: "starting-a-poultry-farm-in-nigeria", title: "Starting a Poultry Farm in Nigeria: A Practical Guide", excerpt: "What you need to know about housing, feeding, day-old chicks and the first 8 weeks on a broiler farm.", image: "assets/images/broiler-chick.jpg", date: "2026-08-12", author: "REC Farm Team", category: "Poultry" },
    { id: "b2", slug: "feeding-your-layers-for-more-eggs", title: "Feeding Your Layers for Maximum Egg Production", excerpt: "A breakdown of layer nutrition and simple management tips that keep your hens laying consistently.", image: "assets/images/eggs.jpg", date: "2026-07-28", author: "REC Farm Team", category: "Poultry" },
    { id: "b3", slug: "catfish-farming-essentials", title: "Catfish Farming Essentials for Beginners", excerpt: "Pond setup, stocking rates, feeding and water quality basics for a successful catfish venture.", image: "assets/images/category-fish.svg", date: "2026-06-15", author: "REC Farm Team", category: "Fish" },
  ];

  const DEMO_SETTINGS = {
    business_name: "REC Livestock & Agro Farms Enterprises",
    motto: "Growing Excellence, Feeding the Future.",
    phone: "+234 813 504 2997",
    whatsapp: "+2347071850599",
    email: "reclivestockagrofarms@gmail.com",
    address: "Abia, Nigeria",
    delivery_note: "We deliver across all 36 states of Nigeria and the FCT.",
    website: "",
    logo_url: "",
    hero_image: "assets/images/hero.png",
    about_image: "assets/images/goat.png",
    social_whatsapp: "",
    social_facebook: "https://www.facebook.com/share/1D56jsdGSk/",
    social_instagram: "https://www.instagram.com/recfarms1864",
    social_tiktok: "https://www.tiktok.com/@rec.livestock.agr",
    social_youtube: "",
    social_telegram: "",
    whatsapp_channel: "https://whatsapp.com/channel/0029VbEHZXE7YScuHR7ebE1W",
    whatsapp_group: "https://chat.whatsapp.com/Gmhomh6VOHtAoaYpx6TlQC?s=cl&p=a&mlu=4&ilr=4",
    telegram_channel: "https://t.me/recfarms/yourchannel",
    telegram_group: "",
  };

  const NIGERIA_STATES = [
    "Abia", "Adamawa", "Akwa Ibom", "Anambra", "Bauchi", "Bayelsa", "Benue",
    "Borno", "Cross River", "Delta", "Ebonyi", "Edo", "Ekiti", "Enugu",
    "FCT - Abuja", "Gombe", "Imo", "Jigawa", "Kaduna", "Kano", "Katsina",
    "Kebbi", "Kogi", "Kwara", "Lagos", "Nasarawa", "Niger", "Ogun", "Ondo",
    "Osun", "Oyo", "Plateau", "Rivers", "Sokoto", "Taraba", "Yobe", "Zamfara",
  ];

  /* Official 774 Local Government Areas grouped by state */
  const LGAS = {
    Abia: ["Aba North","Aba South","Arochukwu","Bende","Ikwuano","Isiala Ngwa North","Isiala Ngwa South","Isuikwuato","Obi Ngwa","Ohafia","Osisioma","Ugwunagbo","Ukwa East","Ukwa West","Umuahia North","Umuahia South","Umu Nneochi"],
    Adamawa: ["Demsa","Fufure","Ganye","Gayuk","Gombi","Grie","Hong","Jada","Lamurde","Madagali","Maiha","Mayo Belwa","Michika","Mubi North","Mubi South","Numan","Shelleng","Song","Toungo","Yola North","Yola South"],
    "Akwa Ibom": ["Abak","Eastern Obolo","Eket","Esit Eket","Essien Udim","Etim Ekpo","Etinan","Ibeno","Ibesikpo Asutan","Ibiono-Ibom","Ika","Ikono","Ikot Abasi","Ikot Ekpene","Ini","Itu","Mbo","Mkpat-Enin","Nsit-Atai","Nsit-Ibom","Nsit-Ubium","Obot Akara","Okobo","Onna","Oron","Oruk Anam","Udung-Uko","Ukanafun","Uruan","Urue-Offong/Oruko","Uyo"],
    Anambra: ["Aguata","Anambra East","Anambra West","Anaocha","Awka North","Awka South","Ayamelum","Dunukofia","Ekwusigo","Idemili North","Idemili South","Ihiala","Njikoka","Nnewi North","Nnewi South","Ogbaru","Onitsha North","Onitsha South","Orumba North","Orumba South","Oyi"],
    Bauchi: ["Alkaleri","Bauchi","Bogoro","Damban","Darazo","Dass","Gamawa","Ganjuwa","Giade","Itas/Gadau","Jama'are","Katagum","Kirfi","Misau","Ningi","Shira","Tafawa Balewa","Toro","Warji","Zaki"],
    Bayelsa: ["Brass","Ekeremor","Kolokuma/Opokuma","Nembe","Ogbia","Sagbama","Southern Ijaw","Yenagoa"],
    Benue: ["Ado","Agatu","Apa","Buruku","Gboko","Guma","Gwer East","Gwer West","Katsina-Ala","Konshisha","Kwande","Logo","Makurdi","Obi","Ogbadibo","Ohimini","Oju","Okpokwu","Otukpo","Tarka","Ukum","Ushongo","Vandeikya"],
    Borno: ["Abadam","Askira/Uba","Bama","Bayo","Biu","Chibok","Damboa","Dikwa","Gubio","Guzamala","Gwoza","Hawul","Jere","Kaga","Kala/Balge","Konduga","Kukawa","Kwaya Kusar","Mafa","Magumeri","Maiduguri","Marte","Mobbar","Monguno","Ngala","Nganzai","Shani"],
    "Cross River": ["Abi","Akamkpa","Akpabuyo","Bakassi","Bekwarra","Biase","Boki","Calabar Municipal","Calabar South","Etung","Ikom","Obanliku","Obubra","Obudu","Odukpani","Ogoja","Yakurr","Yala"],
    Delta: ["Aniocha North","Aniocha South","Bomadi","Burutu","Ethiope East","Ethiope West","Ika North East","Ika South","Isoko North","Isoko South","Ndokwa East","Ndokwa West","Okpe","Oshimili North","Oshimili South","Patani","Sapele","Udu","Ughelli North","Ughelli South","Ukwuani","Uvwie","Warri North","Warri South","Warri South West"],
    Ebonyi: ["Abakaliki","Afikpo North","Afikpo South","Ebonyi","Ezza North","Ezza South","Ikwo","Ishielu","Ivo","Izzi","Ohaozara","Ohaukwu","Onicha"],
    Edo: ["Akoko-Edo","Egor","Esan Central","Esan North-East","Esan South-East","Esan West","Etsako Central","Etsako East","Etsako West","Igueben","Ikpoba-Okha","Oredo","Orhionmwon","Ovia North-East","Ovia South-West","Owan East","Owan West","Uhunmwonde"],
    Ekiti: ["Ado Ekiti","Efon","Ekiti East","Ekiti South-West","Ekiti West","Emure","Gbonyin","Ido Osi","Ijero","Ikere","Ikole","Ilejemeje","Irepodun/Ifelodun","Ise/Orun","Moba","Oye"],
    Enugu: ["Aninri","Awgu","Enugu East","Enugu North","Enugu South","Ezeagu","Igbo Etiti","Igbo Eze North","Igbo Eze South","Isi Uzo","Nkanu East","Nkanu West","Nsukka","Oji River","Udenu","Udi","Uzo-Uwani"],
    "FCT - Abuja": ["Abaji","Bwari","Gwagwalada","Kuje","Kwali","Municipal Area Council"],
    Gombe: ["Akko","Balanga","Billiri","Dukku","Funakaye","Gombe","Kaltungo","Kwami","Nafada","Shongom","Yamaltu/Deba"],
    Imo: ["Aboh Mbaise","Ahiazu Mbaise","Ehime Mbano","Ezinihitte","Ideato North","Ideato South","Ihitte/Uboma","Ikeduru","Isiala Mbano","Isu","Mbaitoli","Ngor Okpala","Njaba","Nkwerre","Nwangele","Obowo","Oguta","Ohaji/Egbema","Okigwe","Onuimo","Orlu","Orsu","Oru East","Oru West","Owerri Municipal","Owerri North","Owerri West","Onuimo"],
    Jigawa: ["Auyo","Babura","Biriniwa","Birnin Kudu","Buji","Dutse","Gagarawa","Garki","Gumel","Guri","Gwaram","Gwiwa","Hadejia","Jahun","Kafin Hausa","Kaugama","Kazaure","Kiri Kasama","Kiyawa","Maigatari","Mallammadori","Ringim","Roni","Sule Tankarkar","Taura","Yankwashi"],
    Kaduna: ["Birnin Gwari","Chikun","Giwa","Igabi","Ikara","Jaba","Jema'a","Kachia","Kaduna North","Kaduna South","Kagarko","Kajuru","Kaura","Kauru","Kubau","Kudan","Lere","Makarfi","Sabon Gari","Sanga","Soba","Zangon Kataf","Zaria"],
    Kano: ["Ajingi","Albasu","Bagwai","Bebeji","Bichi","Bunkure","Dala","Dambatta","Dawakin Kudu","Dawakin Tofa","Doguwa","Fagge","Gabasawa","Garko","Garun Mallam","Gaya","Gezawa","Gwale","Gwarzo","Kabo","Kano Municipal","Karaye","Kibiya","Kiru","Kumbotso","Kunchi","Kura","Madobi","Makoda","Minjibir","Nasarawa","Rano","Rimin Gado","Rogo","Shanono","Sumaila","Takai","Tarauni","Tofa","Tsanyawa","Tudun Wada","Ungogo","Warawa","Wudil"],
    Katsina: ["Bakori","Batagarawa","Batsari","Baure","Bindawa","Charanchi","Dan Musa","Dandume","Danja","Daura","Dutsi","Dutsin Ma","Faskari","Funtua","Ingawa","Jibia","Kafur","Kaita","Kankara","Kankia","Katsina","Kurfi","Kusada","Mai'Adua","Malumfashi","Mani","Mashi","Matazu","Musawa","Rimi","Sabuwa","Safana","Sandamu","Zango"],
    Kebbi: ["Aleiro","Arewa Dandi","Argungu","Augie","Bagudo","Birnin Kebbi","Bunza","Dandi","Fakai","Gwandu","Jega","Kalgo","Koko/Besse","Maiyama","Ngaski","Sakaba","Shanga","Suru","Wasagu/Danko","Yauri","Zuru"],
    Kogi: ["Adavi","Ajaokuta","Ankpa","Bassa","Dekina","Ibaji","Idah","Igalamela Odolu","Ijumu","Kabba/Bunu","Koton Karfe","Lokoja","Mopa Muro","Ofu","Ogori/Magongo","Okehi","Okene","Olamaboro","Omala","Yagba East","Yagba West"],
    Kwara: ["Asa","Baruten","Edu","Ekiti","Ifelodun","Ilorin East","Ilorin South","Ilorin West","Irepodun","Isin","Kaiama","Moro","Offa","Oke Ero","Oyun","Pategi"],
    Lagos: ["Agege","Ajeromi-Ifelodun","Alimosho","Amuwo-Odofin","Apapa","Badagry","Epe","Eti-Osa","Ibeju-Lekki","Ifako-Ijaiye","Ikeja","Ikorodu","Kosofe","Lagos Island","Lagos Mainland","Mushin","Ojo","Oshodi-Isolo","Shomolu","Surulere"],
    Nasarawa: ["Akwanga","Awe","Doma","Karu","Keana","Keffi","Kokona","Lafia","Nasarawa","Nasarawa Egon","Obi","Toto","Wamba"],
    Niger: ["Agaie","Agwara","Bida","Borgu","Bosso","Chanchaga","Edati","Gbako","Gurara","Katcha","Kontagora","Lapai","Lavun","Magama","Mariga","Mashegu","Mokwa","Munya","Paikoro","Rafi","Rijau","Shiroro","Suleja","Tafa","Wushishi"],
    Ogun: ["Abeokuta North","Abeokuta South","Ado-Odo/Ota","Ewekoro","Ifo","Ijebu East","Ijebu North","Ijebu North East","Ijebu Ode","Ikenne","Imeko Afon","Ipokia","Obafemi Owode","Odeda","Odogbolu","Ogun Waterside","Remo North","Sagamu"],
    Ondo: ["Akoko North-East","Akoko North-West","Akoko South-East","Akoko South-West","Akure North","Akure South","Ese Odo","Idanre","Ifedore","Ilaje","Ile Oluji/Okeigbo","Irele","Odigbo","Okitipupa","Ondo East","Ondo West","Ose","Owo"],
    Osun: ["Aiyedade","Aiyedire","Atakumosa East","Atakumosa West","Boluwaduro","Boripe","Ede North","Ede South","Egbedore","Ejigbo","Ife Central","Ife East","Ife North","Ife South","Ifedayo","Ifelodun","Ila","Ilesa East","Ilesa West","Irepodun","Irewole","Isokan","Iwo","Obokun","Odo Otin","Ola Oluwa","Olorunda","Oriade","Orolu","Osogbo"],
    Oyo: ["Afijio","Akinyele","Atiba","Atisbo","Egbeda","Ibadan North","Ibadan North-East","Ibadan North-West","Ibadan South-East","Ibadan South-West","Ibarapa Central","Ibarapa East","Ibarapa North","Ido","Irepo","Isokan","Itesiwaju","Iwajowa","Kajola","Lagelu","Ogbomosho North","Ogbomosho South","Ogo Oluwa","Olorunsogo","Oluyole","Ona Ara","Orelope","Ori Ire","Oyo East","Oyo West","Saki East","Saki West","Surulere"],
    Plateau: ["Barkin Ladi","Bassa","Bokkos","Jos East","Jos North","Jos South","Kanam","Kanke","Langtang North","Langtang South","Mangu","Mikang","Pankshin","Qua'an Pan","Riyom","Shendam","Wase"],
    Rivers: ["Abua/Odual","Ahoada East","Ahoada West","Akuku-Toru","Andoni","Asari-Toru","Bonny","Degema","Eleme","Emuoha","Etche","Gokana","Ikwerre","Khana","Obio/Akpor","Ogba/Egbema/Ndoni","Ogu/Bolo","Okrika","Omuma","Opobo/Nkoro","Oyigbo","Port Harcourt","Tai"],
    Sokoto: ["Binji","Bodinga","Dange Shuni","Gada","Goronyo","Gudu","Gwadabawa","Illela","Isa","Kebbe","Kware","Rabah","Sabon Birni","Shagari","Silame","Sokoto North","Sokoto South","Tambuwal","Tangaza","Tureta","Wamako","Wurno","Yabo"],
    Taraba: ["Ardo Kola","Bali","Donga","Gashaka","Gassol","Ibi","Jalingo","Karim Lamido","Kumi","Lau","Sardauna","Takum","Ussa","Wukari","Yorro","Zing"],
    Yobe: ["Bade","Bursari","Damaturu","Fika","Fune","Geidam","Gujba","Gulani","Jakusko","Karasuwa","Machina","Nangere","Nguru","Potiskum","Tarmuwa","Yunusari","Yusufari"],
    Zamfara: ["Anka","Bakura","Birnin Magaji/Kiyaw","Bukkuyum","Bungudu","Gummi","Gusau","Kaura Namoda","Maradun","Maru","Shinkafi","Talata Mafara","Tsafe","Zurmi"],
  };

  /* ---------- Categories ---------- */
  async function getCategories() {
    const client = sb();
    if (client) {
      const { data, error } = await client
        .from("categories")
        .select("*")
        .order("sort_order", { ascending: true });
      if (!error && data && data.length) return data;
      if (error) console.warn("Categories fetch failed, using demo:", error.message);
    }
    return DEMO_CATEGORIES;
  }

  /* ---------- Products ---------- */
  async function getProducts(opts) {
    opts = opts || {};
    const client = sb();
    if (client) {
      let q = client.from("products").select("*, categories(name, slug)");
      if (opts.active !== false) q = q.eq("active", true);
      if (opts.featured) q = q.eq("featured", true);
      if (opts.categoryId) q = q.eq("category_id", opts.categoryId);
      if (opts.onlineOnly) q = q.eq("online_orderable", true);
      if (opts.search) q = q.ilike("name", "%" + opts.search + "%");
      if (opts.limit) q = q.limit(opts.limit);
      if (opts.order) {
        const [col, dir] = opts.order.split(":");
        q = q.order(col, { ascending: (dir || "asc") !== "desc" });
      }
      const { data, error } = await q;
      if (!error && data) {
        return data.map(normaliseProduct);
      }
      if (error) console.warn("Products fetch failed, using demo:", error.message);
    }
    let list = DEMO_PRODUCTS.filter((p) => (opts.active === false ? true : p.active));
    if (opts.featured) list = list.filter((p) => p.featured);
    if (opts.categoryId) list = list.filter((p) => String(p.category_id) === String(opts.categoryId));
    if (opts.onlineOnly) list = list.filter((p) => p.online_orderable !== false);
    if (opts.search) {
      const s = opts.search.toLowerCase();
      list = list.filter((p) => p.name.toLowerCase().includes(s) || (p.description || "").toLowerCase().includes(s));
    }
    if (opts.limit) list = list.slice(0, opts.limit);
    if (opts.order) {
      const [col, dir] = opts.order.split(":");
      const d = dir === "desc" ? -1 : 1;
      list.sort((a, b) => {
        if (col === "price") return (a.price - b.price) * d;
        return d * String(a.name).localeCompare(b.name);
      });
    }
    return list.map(normaliseProduct);
  }

  async function getFeatured(limit) {
    return getProducts({ featured: true, limit });
  }

  async function getProduct(id) {
    const client = sb();
    if (client) {
      const { data, error } = await client
        .from("products")
        .select("*, categories(name, slug)")
        .eq("id", id)
        .maybeSingle();
      if (data && !error) return normaliseProduct(data);
      if (error) console.warn("Product fetch failed, using demo:", error.message);
    }
    const p = DEMO_PRODUCTS.find((x) => String(x.id) === String(id));
    return p ? normaliseProduct(p) : null;
  }

  async function getRelated(product, limit) {
    const list = await getProducts({ active: true, limit: 12 });
    const out = list.filter(
      (p) => String(p.id) !== String(product.id) && p.category_id === product.category_id
    );
    const pool = out.length >= (limit || 4) ? out : list.filter((p) => String(p.id) !== String(product.id));
    return pool.slice(0, limit || 4);
  }

  function normaliseProduct(p) {
    const cat = p.categories || {};
    const image = pickImage(p);
    return {
      ...p,
      id: p.id,
      category_slug: cat.slug || devCategorySlug(p.category_id),
      category_name: cat.name || devCategoryName(p.category_id),
      image,
      gallery: Array.isArray(p.gallery) && p.gallery.length ? p.gallery : [image],
      price: Number(p.price || 0),
      stock_quantity: p.stock_quantity != null ? Number(p.stock_quantity) : null,
      minimum_order_quantity: Number(p.minimum_order_quantity || 1),
      online_orderable: p.online_orderable !== false,
      active: p.active !== false,
      featured: !!p.featured,
      in_stock: p.stock_quantity == null || Number(p.stock_quantity) > 0,
      low_stock: p.stock_quantity != null && Number(p.stock_quantity) > 0 && Number(p.stock_quantity) <= 10,
    };
  }

  function pickImage(p) {
    if (p.image && p.image !== PLACEHOLDER) return p.image;
    const m = devImage(p.category_slug || devCategorySlug(p.category_id));
    return m || PLACEHOLDER;
  }

  function devCategorySlug(id) {
    const c = DEMO_CATEGORIES.find((c) => String(c.id) === String(id));
    return c ? c.slug : "farm-supplies";
  }
  function devCategoryName(id) {
    const c = DEMO_CATEGORIES.find((c) => String(c.id) === String(id));
    return c ? c.name : "Farm Supplies";
  }
  function devImage(slug) {
    const map = {
      poultry: "assets/images/broiler-chick.jpg",
      eggs: "assets/images/eggs.jpg",
      livestock: "assets/images/goat.png",
      fish: "assets/images/category-fish.svg",
      "farm-supplies": "assets/images/category-supplies.svg",
    };
    return map[slug];
  }

  /* ---------- Testimonials ---------- */
  async function getTestimonials() {
    const client = sb();
    if (client) {
      const { data, error } = await client
        .from("testimonials")
        .select("*")
        .eq("published", true)
        .order("created_at", { ascending: false })
        .limit(6);
      if (!error && data && data.length) return data;
      if (error) console.warn("Testimonials fetch failed, using demo:", error.message);
    }
    return DEMO_TESTIMONIALS;
  }

  /* ---------- Blog ---------- */
  async function getBlogPosts() {
    const client = sb();
    if (client) {
      const { data, error } = await client
        .from("blog_posts")
        .select("*")
        .eq("published", true)
        .order("published_at", { ascending: false });
      if (!error && data && data.length) return data;
      if (error) console.warn("Blog fetch failed, using demo:", error.message);
    }
    return DEMO_BLOG;
  }

  async function getBlogPost(slug) {
    const client = sb();
    if (client) {
      const { data, error } = await client
        .from("blog_posts")
        .select("*")
        .eq("slug", slug)
        .eq("published", true)
        .maybeSingle();
      if (data && !error) return data;
    }
    const demo = DEMO_BLOG.find((b) => b.slug === slug);
    return demo ||
      DEMO_BLOG[0] || {
        title: "REC Blog",
        content: "This post will be published from the REC admin panel.",
      };
  }

  /* ---------- Site settings ---------- */
  async function getSettings() {
    const client = sb();
    if (client) {
      const { data, error } = await client.from("site_settings").select("*").maybeSingle();
      if (data && !error) {
        REC.config.appName = data.business_name || REC.config.appName;
        REC.config.phone = data.phone || REC.config.phone;
        REC.config.email = data.email || REC.config.email;
        if (data.whatsapp) REC.config.phoneRaw = String(data.whatsapp).replace(/\D/g, "");
        return data;
      }
    }
    return DEMO_SETTINGS;
  }

  /* ---------- Delivery zones ---------- */
  async function getDeliveryZones(state) {
    const client = sb();
    if (client) {
      let q = client.from("delivery_zones").select("*").eq("active", true);
      if (state) q = q.eq("state", state);
      const { data, error } = await q.order("state", { ascending: true });
      if (!error && data) return data;
    }
    return null; // caller falls back to default nationwide fee
  }

  /* ---------- Pickup stations ---------- */
  async function getPickupStations() {
    const client = sb();
    if (client) {
      const { data, error } = await client
        .from("pickup_stations")
        .select("*")
        .eq("active", true)
        .order("sort_order", { ascending: true })
        .order("name", { ascending: true });
      if (!error && data) return data;
    }
    return [];
  }

  /* ---------- Favorites ---------- */
  const FAV_KEY = "rec_favorites";
  const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  function isValidUuid(id) {
    return UUID_RE.test(String(id));
  }

  REC.favorites = {
    list() {
      try {
        return JSON.parse(localStorage.getItem(FAV_KEY)) || [];
      } catch (e) {
        return [];
      }
    },
    _save(list) {
      localStorage.setItem(FAV_KEY, JSON.stringify(list));
    },
    _client() {
      REC.initSupabase();
      return REC.supabaseClient;
    },
    _user() {
      if (!REC.auth || typeof REC.auth.currentUser !== "function") return null;
      const cur = REC.auth.currentUser();
      return cur && cur.user && cur.user.id ? cur.user.id : null;
    },
    toggle(productId) {
      let list = REC.favorites.list();
      const s = String(productId);
      const on = !list.includes(s);
      if (on) list.push(s);
      else list = list.filter((x) => x !== s);
      REC.favorites._save(list);
      REC.favorites._syncOne(s, on);
      return list;
    },
    has(productId) {
      return REC.favorites.list().includes(String(productId));
    },
    async _syncOne(productId, on) {
      const client = REC.favorites._client();
      const uid = REC.favorites._user();
      if (!client || !uid || !isValidUuid(productId)) return;
      try {
        if (on) {
          await client.from("favorites").upsert({ user_id: uid, product_id: productId }, { onConflict: "user_id,product_id" });
        } else {
          await client.from("favorites").delete().match({ user_id: uid, product_id: productId });
        }
      } catch (e) {
        if (win.console && console.warn) console.warn("favorites sync:", e.message);
      }
    },
    async init() {
      const client = REC.favorites._client();
      const uid = REC.favorites._user();
      if (!client || !uid) return;
      try {
        const { data, error } = await client.from("favorites").select("product_id");
        if (error) return;
        const dbIds = (data || []).map((r) => String(r.product_id));
        const local = REC.favorites.list().map(String);
        const merged = Array.from(new Set(local.concat(dbIds)));
        REC.favorites._save(merged);
        const toPush = merged.filter((id) => isValidUuid(id) && !dbIds.includes(id));
        if (toPush.length) {
          await client.from("favorites").upsert(
            toPush.map((id) => ({ user_id: uid, product_id: id })),
            { onConflict: "user_id,product_id" }
          );
        }
        REC.favorites._applyToDom(merged);
        win.dispatchEvent(new CustomEvent("rec:favchange", { detail: { ids: merged } }));
      } catch (e) {
        if (win.console && console.warn) console.warn("favorites init:", e.message);
      }
    },
    _applyToDom(ids) {
      const set = new Set(ids.map(String));
      document.querySelectorAll("[data-fav]").forEach((btn) => {
        const on = set.has(String(btn.getAttribute("data-fav")));
        btn.classList.toggle("active", on);
        btn.setAttribute("aria-pressed", on ? "true" : "false");
      });
    },
  };

  REC.products = {
    getCategories,
    getProducts,
    getFeatured,
    getProduct,
    getRelated,
    getTestimonials,
    getBlogPosts,
    getBlogPost,
    getSettings,
    getDeliveryZones,
    getPickupStations,
    STATES: NIGERIA_STATES,
    LGAS: LGAS,
    DEMO_PRODUCTS,
    PLACEHOLDER,
    money: UI.money,
  };

  win.REC = REC;

  document.addEventListener("DOMContentLoaded", () => {
    if (REC.isSupabaseConfigured && REC.isSupabaseConfigured() && REC.favorites) REC.favorites.init();
  });
})(window);