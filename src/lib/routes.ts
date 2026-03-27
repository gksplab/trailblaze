export interface Waypoint {
  lat: number;
  lng: number;
  name: string;
  distanceFromStart: number;
  funFact: string;
  postcard: string;
  streetViewHeading: number;
}

export interface Route {
  id: string;
  name: string;
  country: string;
  totalDistance: number;
  description: string;
  difficulty: "Easy" | "Moderate" | "Challenging";
  estimatedDays: string;
  postcardsCount: number;
  waypoints: Waypoint[];
  /** Dense lat/lng points along major streets for a clean polyline on the map. */
  path: { lat: number; lng: number }[];
}

// IMPORTANT: Waypoints are ordered as a walkable path — each one leads
// geographically to the next so the Directions API draws a clean route.

export const routes: Route[] = [
  {
    id: "athens",
    name: "Athens on Foot",
    country: "Greece 🇬🇷",
    totalDistance: 35,
    description: "Walk through 3,000 years of history — from the ancient Agora to the marble of the Parthenon, down through Plaka's winding streets to the sea at Piraeus.",
    difficulty: "Moderate",
    estimatedDays: "7–14 days",
    postcardsCount: 9,
    // Clean polyline: Syntagma → S through gardens → Stadium → W to Temple →
    // NW into Plaka → S to Acropolis → SW to Filopappou → N to Agora →
    // NW to Kerameikos → S on Pireos Ave to Piraeus
    path: [
      { lat: 37.9753, lng: 23.7354 }, // Syntagma
      { lat: 37.9735, lng: 23.7370 }, // National Garden path
      { lat: 37.9710, lng: 23.7390 },
      { lat: 37.9681, lng: 23.7411 }, // Stadium
      { lat: 37.9685, lng: 23.7380 }, // Vas. Olgas west
      { lat: 37.9690, lng: 23.7350 },
      { lat: 37.9693, lng: 23.7330 }, // Temple of Zeus
      { lat: 37.9710, lng: 23.7310 }, // walk north
      { lat: 37.9730, lng: 23.7290 },
      { lat: 37.9745, lng: 23.7279 }, // Plaka / Tower of Winds
      { lat: 37.9735, lng: 23.7275 },
      { lat: 37.9715, lng: 23.7268 }, // Acropolis
      { lat: 37.9712, lng: 23.7255 },
      { lat: 37.9709, lng: 23.7242 }, // Odeon
      { lat: 37.9700, lng: 23.7222 },
      { lat: 37.9693, lng: 23.7202 }, // Filopappou
      { lat: 37.9715, lng: 23.7210 }, // descend north
      { lat: 37.9740, lng: 23.7218 },
      { lat: 37.9763, lng: 23.7222 }, // Agora
      { lat: 37.9775, lng: 23.7195 },
      { lat: 37.9784, lng: 23.7168 }, // Kerameikos
      { lat: 37.9760, lng: 23.7120 }, // Pireos Ave south
      { lat: 37.9700, lng: 23.7000 },
      { lat: 37.9630, lng: 23.6850 },
      { lat: 37.9560, lng: 23.6680 },
      { lat: 37.9484, lng: 23.6441 }, // Piraeus
    ],
    waypoints: [
      {
        lat: 37.9753, lng: 23.7354, name: "Syntagma Square", distanceFromStart: 0, streetViewHeading: 200,
        funFact: "Named after the revolt that forced King Otto to grant a constitution in 1843.",
        postcard: "Your journey begins at the heart of modern Greece. Beneath your feet, 1990s metro excavations uncovered a 4,000-year-old cemetery — proof that people have gathered on this exact spot since the Bronze Age. The Evzone guards changing before you have performed their slow, hypnotic ritual since 1833, every hour, every day, rain or revolution."
      },
      {
        lat: 37.9681, lng: 23.7411, name: "Panathenaic Stadium", distanceFromStart: 4, streetViewHeading: 150,
        funFact: "Rebuilt for the 1896 Olympics entirely in white marble — the only all-marble stadium in the world.",
        postcard: "You're standing in the only stadium in the world built entirely of marble, rebuilt for the 1896 Olympics — the first modern Games. But its roots go back to 566 BC, when the Panathenaic Games were first held here. 50,000 spectators watched chariot races on this exact track. At the 1896 opening ceremony, King George I declared the games open to athletes from 14 nations — and the world hasn't stopped competing since."
      },
      {
        lat: 37.9693, lng: 23.7330, name: "Temple of Olympian Zeus", distanceFromStart: 8, streetViewHeading: 320,
        funFact: "Construction took 638 years to complete — started in the 6th century BC, finished by Emperor Hadrian in 131 AD.",
        postcard: "This temple took 638 years to build. Started in the 6th century BC, abandoned, restarted, and finally completed by Emperor Hadrian in 131 AD. At its peak it housed one of the largest cult statues in the ancient world — a chryselephantine Zeus made of ivory and gold. The arch beside it marks where ancient Athens ended and Roman Athens began. One face reads: 'This is Athens, city of Theseus.' The other: 'This is the city of Hadrian.' Two thousand years of history separated by a single doorway."
      },
      {
        lat: 37.9745, lng: 23.7279, name: "Plaka — Tower of the Winds", distanceFromStart: 11, streetViewHeading: 90,
        funFact: "The world's first meteorological station, built in the 1st century BC. Sufi dervishes later whirled inside.",
        postcard: "You've reached the world's oldest meteorological station. Built in the 1st century BC, each of its eight sides faces a cardinal wind — carved gods blow breath toward the city below. Inside, a water clock driven by a stream from the Acropolis once told the time. For centuries under Ottoman rule, Sufi dervishes used this octagonal chamber for their whirling ceremonies, spinning in the same space that once measured wind and water."
      },
      {
        lat: 37.9715, lng: 23.7268, name: "The Acropolis", distanceFromStart: 14, streetViewHeading: 310,
        funFact: "The Parthenon was painted vivid red, blue and gold — the 'pure white' we see now would be unrecognisable to its builders.",
        postcard: "The Parthenon's marble glows golden above you — but when it was completed in 438 BC, it was painted vivid red, blue and gold. Ancient Athenians would barely recognise the 'pure white' ruin we admire today. For 2,000 years it served as a temple, then a church, then a mosque — until 1687, when Venetian cannon fire hit the Ottomans' gunpowder store inside and blew out the centre in a single catastrophic explosion."
      },
      {
        lat: 37.9709, lng: 23.7242, name: "Odeon of Herodes Atticus", distanceFromStart: 17, streetViewHeading: 250,
        funFact: "This Roman theatre has hosted uninterrupted performances for almost 2,000 years — Maria Callas and Frank Sinatra both sang here.",
        postcard: "Built in 161 AD as a memorial to Herodes Atticus's wife Regilla, this theatre has hosted performances for almost two millennia without interruption. Maria Callas sang here. Frank Sinatra performed beneath these same stars. The acoustics are so perfect that a whisper on stage reaches the back row without amplification — a feat modern architects still struggle to replicate."
      },
      {
        lat: 37.9693, lng: 23.7202, name: "Filopappou Hill", distanceFromStart: 20, streetViewHeading: 180,
        funFact: "From this hill, Athenian generals surveyed Marathon in 490 BC before the battle that saved Western democracy.",
        postcard: "From this summit you see the same panorama that Athenian generals studied before the Battle of Marathon in 490 BC. Below you lies the Pnyx, where citizens voted on laws by show of hands — the birthplace of direct democracy. The monument at the peak was built in 115 AD for Philopappos, a Syrian prince who loved Athens so deeply he was honoured with this view for eternity."
      },
      {
        lat: 37.9763, lng: 23.7222, name: "Ancient Agora", distanceFromStart: 24, streetViewHeading: 180,
        funFact: "Socrates was condemned to death just metres from here. The world's first democracy was born in these ruins.",
        postcard: "Socrates was condemned to death just metres from where you're standing. This was Athens' marketplace, law court, and philosophical salon — the world's first democracy was argued into existence on these stones. The Temple of Hephaestus towering above you is the best-preserved ancient Greek temple in the world, surviving 2,500 years because Byzantines converted it to a church."
      },
      {
        lat: 37.9784, lng: 23.7168, name: "Kerameikos Cemetery", distanceFromStart: 28, streetViewHeading: 270,
        funFact: "Athens' most important cemetery for 1,000 years. The Sacred Way to Eleusis began here.",
        postcard: "Kerameikos was Athens' most sacred burial ground for over a millennium. The Sacred Way began here — the road walked by pilgrims to Eleusis for the Mysteries, the ancient world's most powerful religious ceremony whose secrets were kept so well we still don't know what happened. Plato describes Socrates walking this road on the morning he drank the hemlock. The potters — 'kerameis' — who gave the area its name also gave us the word 'ceramic.'"
      },
      {
        lat: 37.9484, lng: 23.6441, name: "Piraeus Port", distanceFromStart: 35, streetViewHeading: 200,
        funFact: "The world's longest continuously operational harbour — 2,500 years and counting.",
        postcard: "You've reached the end of one of humanity's longest-running harbours. Piraeus has served Athens for 2,500 unbroken years — in the 5th century BC, 400 warships anchored where cruise liners now dock. The ancient Long Walls that once connected Piraeus to Athens stretched almost exactly the distance you have just walked. History has a sense of symmetry."
      }
    ]
  },
  {
    id: "amsterdam",
    name: "Amsterdam Canal Loop",
    country: "Netherlands 🇳🇱",
    totalDistance: 42,
    description: "A clockwise loop of the legendary canal ring — from the old harbour west through the Golden Age, south past the museums, east through the markets, and back north along the waterfront.",
    difficulty: "Easy",
    estimatedDays: "7–10 days",
    postcardsCount: 11,
    // Clean polyline: clockwise canal-ring loop — west down Prinsengracht,
    // south past museums, east along Amstel, north up to NEMO, west to Jordaan
    path: [
      { lat: 52.3791, lng: 4.9003 }, // Centraal
      { lat: 52.3780, lng: 4.8950 }, // west along Prins Hendrikkade
      { lat: 52.3765, lng: 4.8900 },
      { lat: 52.3752, lng: 4.8840 }, // Anne Frank House
      { lat: 52.3730, lng: 4.8845 }, // south on Prinsengracht
      { lat: 52.3710, lng: 4.8848 }, // Nine Streets
      { lat: 52.3680, lng: 4.8842 },
      { lat: 52.3642, lng: 4.8838 }, // Leidseplein
      { lat: 52.3620, lng: 4.8845 },
      { lat: 52.3600, lng: 4.8852 }, // Rijksmuseum
      { lat: 52.3595, lng: 4.8880 }, // Stadhouderskade east
      { lat: 52.3610, lng: 4.8910 },
      { lat: 52.3640, lng: 4.8930 },
      { lat: 52.3668, lng: 4.8936 }, // Bloemenmarkt
      { lat: 52.3665, lng: 4.8960 },
      { lat: 52.3662, lng: 4.8975 }, // Rembrandtplein
      { lat: 52.3670, lng: 4.9010 },
      { lat: 52.3685, lng: 4.9044 }, // Waterlooplein
      { lat: 52.3678, lng: 4.9100 },
      { lat: 52.3662, lng: 4.9162 }, // Artis
      { lat: 52.3690, lng: 4.9155 }, // north
      { lat: 52.3720, lng: 4.9140 },
      { lat: 52.3740, lng: 4.9122 }, // NEMO
      { lat: 52.3755, lng: 4.9080 }, // west along waterfront
      { lat: 52.3760, lng: 4.9020 },
      { lat: 52.3755, lng: 4.8960 },
      { lat: 52.3750, lng: 4.8900 },
      { lat: 52.3745, lng: 4.8848 }, // Westerkerk
      { lat: 52.3755, lng: 4.8820 },
      { lat: 52.3770, lng: 4.8780 }, // Jordaan
    ],
    waypoints: [
      {
        lat: 52.3791, lng: 4.9003, name: "Amsterdam Centraal", distanceFromStart: 0, streetViewHeading: 180,
        funFact: "Built on 8,687 wooden piles in the IJ river — fishermen rioted because it blocked their harbour view.",
        postcard: "Your adventure begins atop 8,687 wooden piles driven into the marshy IJ riverbed. When Centraal was built in 1889, Amsterdam's fishermen were furious: it blocked their view of the water that had made them rich. The neo-Gothic facade was designed to rival any cathedral — but it's really a cathedral to the railway age, its towers originally serving as wind vanes for the harbour below."
      },
      {
        lat: 52.3752, lng: 4.8840, name: "Anne Frank House", distanceFromStart: 4, streetViewHeading: 120,
        funFact: "Eight people lived in a hidden 60m² apartment behind a bookcase for 761 days.",
        postcard: "For 761 days, eight people lived in 60 square metres behind a bookcase at Prinsengracht 263. Anne was 13 when she began her diary, 15 when the Gestapo came. Her last entry was three days before her arrest. The Westerkerk bells next door gave her comfort — she wrote that their sound connected her to a world she could no longer see. Of the 107,000 Dutch Jews deported, only 5,200 returned. Anne died in Bergen-Belsen weeks before liberation."
      },
      {
        lat: 52.3710, lng: 4.8848, name: "Nine Streets", distanceFromStart: 8, streetViewHeading: 200,
        funFact: "These nine streets were the heart of Amsterdam's leather-tanning industry — the old trade names survive.",
        postcard: "The Nine Streets were once the working heart of Amsterdam's leather-tanning industry. Reestraat means 'deer street', Hartenstraat means 'hart street' — named for the animals whose hides cured in the canal-side workshops. In the Golden Age, these tanners supplied boots to half of Europe's armies. Today the same 17th-century houses hide boutiques in vaulted basements that once reeked of lime and bark."
      },
      {
        lat: 52.3642, lng: 4.8838, name: "Leidseplein", distanceFromStart: 12, streetViewHeading: 90,
        funFact: "Amsterdam's entertainment hub since the 17th century, when farmers from Leiden parked their carts here.",
        postcard: "Leidseplein has been Amsterdam's entertainment district since the 1600s, when farmers arriving from Leiden parked their carts here. The Paradiso club in the converted church behind you hosted the Rolling Stones in 1967. The street performers working this square follow a tradition stretching back to the Golden Age: acrobats, musicians, and pickpockets, essentially unchanged across four centuries."
      },
      {
        lat: 52.3600, lng: 4.8852, name: "Rijksmuseum", distanceFromStart: 16, streetViewHeading: 350,
        funFact: "When Rembrandt's 'The Night Watch' was moved in 1715, 60cm was cut from each side — it wouldn't fit through the door.",
        postcard: "Rembrandt's 'The Night Watch' hangs here — the most famous painting in the Netherlands. But the version you see is already trimmed: when it was moved in 1715, it wouldn't fit through the door, so 60cm was cut from each side. Nobody blinked. The museum was so central to Dutch life that when planners needed a bicycle lane in 1885, they simply built it through the ground floor. Cyclists still ride through the Rijksmuseum today."
      },
      {
        lat: 52.3668, lng: 4.8936, name: "Bloemenmarkt", distanceFromStart: 20, streetViewHeading: 135,
        funFact: "The world's only floating flower market — 20 million tulip bulbs a year from houseboats moored since 1862.",
        postcard: "The Bloemenmarkt floats on houseboats moored to the Singel canal since 1862. Dutch growers once sailed their flowers directly from the fields into the city centre, selling from their boats. During WWII, resistance fighters hid weapons and forged papers beneath the stalls — the sweet smell of tulips masking much darker cargo underneath. Today it shifts 20 million bulbs a year."
      },
      {
        lat: 52.3662, lng: 4.8975, name: "Rembrandtplein", distanceFromStart: 24, streetViewHeading: 45,
        funFact: "22 life-size bronze figures from 'The Night Watch' surround Rembrandt's statue, bringing the painting to 3D life.",
        postcard: "This was Amsterdam's butter market for centuries before anyone named it after Rembrandt. The bronze statue at its centre was placed in 1852. In 2006, twenty-two life-size figures from 'The Night Watch' were cast around him, bringing his most famous painting to three-dimensional life. On Friday nights, this is still where Amsterdammers come to argue, drink, and begin friendships they'll regret."
      },
      {
        lat: 52.3685, lng: 4.9044, name: "Waterlooplein", distanceFromStart: 28, streetViewHeading: 180,
        funFact: "Heart of Amsterdam's Jewish Quarter for 400 years. Of 80,000 Jews before WWII, fewer than 15,000 survived.",
        postcard: "Waterlooplein was the heart of Amsterdam's Jewish quarter for four centuries. Before WWII, 80,000 Jews lived in Amsterdam; by 1945, fewer than 15,000 remained. The flea market here has traded since 1893 — for generations it was the only place Jewish merchants were permitted to sell second-hand goods. Walking through it today is walking through a history of unimaginable loss and extraordinary resilience."
      },
      {
        lat: 52.3662, lng: 4.9162, name: "Artis Zoo", distanceFromStart: 32, streetViewHeading: 90,
        funFact: "During WWII, the zoo director hid Jewish children and Resistance fighters among the animal enclosures.",
        postcard: "Artis is Europe's oldest zoo, opened in 1838. Its most remarkable story comes from WWII, when director Suze Ruys used the enclosures to hide Jewish children and Resistance fighters. The zoo's remote location made it an improbable safe haven. Several hundred people survived the occupation hidden among the animals. The zoo kept no records — the only evidence is the testimony of those who lived."
      },
      {
        lat: 52.3740, lng: 4.9122, name: "NEMO Science Museum", distanceFromStart: 36, streetViewHeading: 270,
        funFact: "Designed by Renzo Piano to look like a green copper ship — sits directly above the IJ Tunnel entrance.",
        postcard: "The green copper ship rising from Amsterdam's harbour is Renzo Piano's NEMO, built in 1997 atop the IJ Tunnel. Its deliberate verdigris patina was designed to look as though it had always been here. From its rooftop you see the same horizon that Golden Age merchants watched anxiously, scanning for ships returning from the East Indies. The view hasn't changed. The cargo has."
      },
      {
        lat: 52.3745, lng: 4.8848, name: "Westerkerk", distanceFromStart: 39, streetViewHeading: 90,
        funFact: "Rembrandt is buried inside — but nobody knows where, as he died penniless and received an unmarked grave.",
        postcard: "Rembrandt van Rijn lies somewhere beneath this church — though nobody knows exactly where. He died penniless in 1669 and was given an unmarked pauper's grave. The Westerkerk's carillon plays every quarter hour and can be heard across the canal ring. You've nearly completed the loop now, and these bells have been marking the hours of this city since 1631 — through Golden Ages and occupations, floods and liberations."
      },
      {
        lat: 52.3770, lng: 4.8780, name: "Jordaan District", distanceFromStart: 42, streetViewHeading: 45,
        funFact: "Built in 1613 for Huguenot refugees — its flower-named streets remember the gardens they planted from home.",
        postcard: "You've completed the canal loop in the neighbourhood that was Amsterdam's own refugee quarter. The Jordaan was built in 1613 for Huguenots fleeing persecution in France. Its street names tell their story: Laurierstraat (Laurel), Rozenstraat (Rose), Bloemstraat (Flower) — named for the gardens the refugees planted to remember home. Its hidden 'hofjes', almshouse courtyards behind unmarked doors, remain the most charming secret in a city that has always known how to welcome strangers."
      }
    ]
  },
  {
    id: "cairo",
    name: "Cairo & Giza Explorer",
    country: "Egypt 🇪🇬",
    totalDistance: 48,
    description: "Journey through one of the world's oldest civilisations — east into medieval Islamic Cairo, south through the Coptic Quarter, then west across the Nile to the last surviving Wonder of the Ancient World.",
    difficulty: "Challenging",
    estimatedDays: "10–21 days",
    postcardsCount: 11,
    // Clean polyline: Tahrir east to Islamic Cairo, south through Citadel /
    // Old Cairo, then west across the Nile to Giza plateau
    path: [
      { lat: 30.0444, lng: 31.2357 }, // Tahrir Square
      { lat: 30.0460, lng: 31.2450 }, // east toward Islamic Cairo
      { lat: 30.0465, lng: 31.2550 },
      { lat: 30.0473, lng: 31.2623 }, // Khan el-Khalili
      { lat: 30.0459, lng: 31.2631 }, // Al-Azhar
      { lat: 30.0400, lng: 31.2620 }, // south
      { lat: 30.0340, lng: 31.2610 },
      { lat: 30.0285, lng: 31.2598 }, // Citadel
      { lat: 30.0255, lng: 31.2545 }, // southwest
      { lat: 30.0226, lng: 31.2493 }, // Ibn Tulun
      { lat: 30.0170, lng: 31.2420 },
      { lat: 30.0110, lng: 31.2350 },
      { lat: 30.0053, lng: 31.2296 }, // Old Cairo
      { lat: 30.0015, lng: 31.2340 },
      { lat: 29.9980, lng: 31.2398 }, // Fustat
      { lat: 29.9920, lng: 31.2360 }, // south along Nile
      { lat: 29.9850, lng: 31.2300 }, // Nile Corniche
      { lat: 29.9860, lng: 31.2150 }, // heading west
      { lat: 29.9865, lng: 31.2000 },
      { lat: 29.9870, lng: 31.1850 },
      { lat: 29.9870, lng: 31.1700 }, // Giza Plateau
      { lat: 29.9840, lng: 31.1550 },
      { lat: 29.9800, lng: 31.1400 },
      { lat: 29.9779, lng: 31.1336 }, // Solar Boat
      { lat: 29.9765, lng: 31.1360 },
      { lat: 29.9753, lng: 31.1376 }, // Sphinx
      { lat: 29.9770, lng: 31.1345 },
      { lat: 29.9792, lng: 31.1320 }, // Great Pyramid
    ],
    waypoints: [
      {
        lat: 30.0444, lng: 31.2357, name: "Tahrir Square", distanceFromStart: 0, streetViewHeading: 0,
        funFact: "Tahrir means 'liberation' — built by Khedive Ismail, who wanted Cairo to rival Paris.",
        postcard: "Your journey begins at the symbolic centre of modern Egypt. The Egyptian Museum behind you holds the world's largest collection of ancient antiquities — including Tutankhamun's golden death mask, still wearing the expression of a boy-king who died at 19. This square holds a different kind of history: in February 2011, over a million people gathered here and the world watched. The word Tahrir means liberation."
      },
      {
        lat: 30.0473, lng: 31.2623, name: "Khan el-Khalili Bazaar", distanceFromStart: 4, streetViewHeading: 90,
        funFact: "Founded in 1382. Fishawi's coffeehouse has been open 24/7 for over 200 years.",
        postcard: "Khan el-Khalili was founded in 1382 as a caravanserai for merchant caravans crossing the Islamic world. For 640 years its labyrinthine alleys have traded in gold, spices, perfume, and secrets. Fishawi's coffeehouse has been open 24 hours a day, 7 days a week, for over 200 years — it served Naguib Mahfouz, Egypt's Nobel laureate, who came here every afternoon to write. You can still sit at his table."
      },
      {
        lat: 30.0459, lng: 31.2631, name: "Al-Azhar Mosque", distanceFromStart: 7, streetViewHeading: 180,
        funFact: "Founded in 970 AD — the world's second-oldest university, predating Oxford by 175 years.",
        postcard: "Al-Azhar has been teaching continuously for over a thousand years — founded in 970 AD, it predates Oxford by 175 years. For a millennium it has been the intellectual centre of Sunni Islam, shaping theology from Morocco to Indonesia. Its name means 'the resplendent', honouring Fatima al-Zahra. Students have always come here on foot from across the Islamic world, carrying nothing but their desire to learn."
      },
      {
        lat: 30.0285, lng: 31.2598, name: "Citadel of Saladin", distanceFromStart: 11, streetViewHeading: 270,
        funFact: "Built in 1176 to repel the Crusaders. The clock tower was a gift from France — Egypt got the worse deal.",
        postcard: "Saladin built this fortress in 1176 to defend Cairo from the Crusaders — standing here, you understand why it was impregnable. For 700 years the Citadel was the seat of Egyptian power. The Muhammad Ali Mosque inside has alabaster walls so luminous they seem to glow from within. The clock tower outside was a gift from France in exchange for the obelisk now in Paris's Place de la Concorde. Egypt's clock never worked. France's obelisk is still standing."
      },
      {
        lat: 30.0226, lng: 31.2493, name: "Ibn Tulun Mosque", distanceFromStart: 15, streetViewHeading: 140,
        funFact: "Cairo's oldest mosque still in its original 876 AD form. Its spiral minaret is the only one of its kind in Egypt.",
        postcard: "Ibn Tulun is Cairo's oldest mosque still standing in its original 876 AD form. Its governor Ahmed ibn Tulun dreamed of making Egypt independent from Baghdad, and this mosque was his declaration. The spiral minaret — the only one of its kind in Egypt — was inspired by the ziggurats of Iraq. Over the centuries it served as a mosque, a salt depot, a caravanserai, and a Napoleonic hospital. It has outlived every purpose except prayer."
      },
      {
        lat: 30.0053, lng: 31.2296, name: "Old Cairo", distanceFromStart: 19, streetViewHeading: 200,
        funFact: "The Hanging Church has been a place of worship since the 3rd century, built over a Roman fortress.",
        postcard: "Babylon Fortress beneath your feet was built by Emperor Augustus in 30 BC — before Islam, before Christianity reached Egypt. The Hanging Church above it has been a place of worship since the 3rd century, suspended over the Roman gatehouse like a bridge between eras. According to Coptic tradition, the Holy Family sheltered here during their flight to Egypt. The cemetery nearby holds inscriptions in four scripts — Old Cairo has absorbed more civilisations than most countries have known."
      },
      {
        lat: 29.9980, lng: 31.2398, name: "Fustat Ruins", distanceFromStart: 23, streetViewHeading: 160,
        funFact: "Egypt's first Arab capital, founded 641 AD. Its own rulers burned it to the ground in 1168 rather than let Crusaders take it.",
        postcard: "Fustat was the first Arab capital of Egypt, founded in 641 AD after the Islamic conquest. For five centuries it was the largest city in the Arab world — 200,000 people, great libraries, international trade. Then in 1168, the Fatimid rulers burned their own capital to the ground rather than let the Crusaders capture it. The ruins contain enough intact pottery to rewrite the history of medieval trade. Archaeologists have barely scratched the surface."
      },
      {
        lat: 29.9850, lng: 31.2300, name: "Nile Corniche", distanceFromStart: 27, streetViewHeading: 250,
        funFact: "The Nile flooded like clockwork for 7,000 years — until the Aswan Dam stopped it in 1970.",
        postcard: "You're walking along the river that made Egypt. Everything around you exists because of the annual flood that deposited black silt across the desert, creating farmland in a land of sand. The ancient Egyptians called their country 'Kemet' — the Black Land — for this silt. For 7,000 years the Nile flooded like clockwork; since the Aswan Dam was completed in 1970, it floods no more. The silt no longer comes. Egypt must fertilise its fields with chemicals instead of miracles."
      },
      {
        lat: 29.9870, lng: 31.1700, name: "Giza Plateau", distanceFromStart: 33, streetViewHeading: 220,
        funFact: "The three pyramids were built over 78 years, when the rest of humanity lived in scattered villages.",
        postcard: "You're approaching the edge of the ancient world. The Giza plateau was chosen because its bedrock was solid limestone — perfect for bearing the weight of eternity. The three pyramids were built between 2589 and 2511 BC, over 78 years, during a period when the rest of humanity was still living in scattered villages. Herodotus visited in 440 BC and declared them a Wonder of the World. They had already been standing for 2,000 years when he arrived."
      },
      {
        lat: 29.9779, lng: 31.1336, name: "Solar Boat Museum", distanceFromStart: 38, streetViewHeading: 60,
        funFact: "A 4,600-year-old cedar boat found sealed in a pit — workers reported smelling fresh wood when it was opened.",
        postcard: "In 1954, archaeologists opened a sealed pit beside the Great Pyramid and found a 4,600-year-old boat — 1,224 pieces of Lebanese cedar. It took 14 years to reconstruct. The Solar Boat was built to carry Pharaoh Khufu into the afterlife across the celestial Nile. When the pit was opened, workers reported smelling fresh wood — 4,600 years of sealed time released in a single breath."
      },
      {
        lat: 29.9753, lng: 31.1376, name: "The Great Sphinx", distanceFromStart: 43, streetViewHeading: 45,
        funFact: "73m long, carved from a single rock. Its nose was already missing by the 14th century.",
        postcard: "The Sphinx was carved from a single limestone outcrop around 2500 BC — the largest monolith sculpture ever made. Its face is believed to be Pharaoh Khafre, though no one has proved it. The nose was not shot off by Napoleon — records show it was gone by the 14th century, reportedly destroyed by a Sufi mystic outraged that locals were offering the Sphinx prayers. For four and a half thousand years it has stared east at the sunrise, watching civilisations rise and fall."
      },
      {
        lat: 29.9792, lng: 31.1320, name: "Great Pyramid of Giza", distanceFromStart: 48, streetViewHeading: 90,
        funFact: "The tallest man-made structure on Earth for 3,800 years. 2.3 million blocks, some weighing 80 tonnes.",
        postcard: "You have reached the last surviving Wonder of the Ancient World. The Great Pyramid was the tallest structure on Earth for 3,800 years — from 2566 BC until Lincoln Cathedral surpassed it in 1311 AD. It contains 2.3 million stone blocks weighing up to 80 tonnes each. No one has definitively explained how it was built. Napoleon, standing here in 1798, calculated that the stone in the three Giza pyramids could build a wall 3 metres high around all of France. He was right. You've walked the full distance — from revolution to revelation."
      }
    ]
  }
];
