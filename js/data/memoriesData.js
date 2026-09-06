/**
 * ============================================================================
 * OUR VINAYAKA CHATURTHI MEMORIES - CENTRAL DATA STORE
 * ============================================================================
 * Updated with real festival photos & videos: Aagman, Road Trip, Mandap Setup,
 * Gang Selfies, Murti, DJ Night, Annadanam Prasad Feast, and Visarjan Immersion!
 */

export const memoriesData = {
  version: "2026.08.22.1530",
  lastUpdated: "2026-08-22T15:30:00+05:30",

  // 1. HERO SECTION CONFIGURATION
  hero: {
    badge: "✨ Welcome to Our Memories • మన జ్ఞాపకాలు ఎప్పటికీ మనతోనే ❤️",
    preTitleQuote: "“Some festivals end, but some memories stay forever.”",
    mainTitle: "Our Vinayaka Chaturthi Memories",
    welcomeTitle: "Welcome to Our Memories ❤️",
    welcomeTelugu: "మన పండుగలోని అందమైన క్షణాలు, మనుషులు, జ్ఞాపకాలు… అన్నీ ఒక్కచోట.",
    welcomeDesc: "A digital time capsule created with love for everyone in our street — kids, teenagers, adults, and elders. Explore our cherished festival moments or leave a heartfelt memory of your own!",
    description: "A nostalgic journey through the laughter, the road trips, the grand aagman, the sacred annadanam, and the unforgettable moments we created together with Lord Ganesha.",
    bgImage: "assets/images/real_gang_pandal_mandap.jpg",
    ctaExplore: "EXPLORE MEMORIES",
    ctaExploreTelugu: "జ్ఞాపకాలను చూడండి 📸",
    ctaLeave: "LEAVE A MEMORY",
    ctaLeaveTelugu: "మీ జ్ఞాపకాన్ని పంచుకోండి ✍️",
    ctaVideos: "WATCH VIDEOS",
    ctaVideosTelugu: "వీడియోలు చూడండి 🎬",
    ctaText: "Enter Our Memories",
    audioTitle: "Sacred Ragas • Tanpura & Flute Harmony"
  },

  // 2. "THE BEGINNING" (PREPARATIONS & EXCITEMENT)
  theBeginning: {
    tag: "Day 0 & The First Spark",
    title: "Where Every Beautiful Memory Began",
    narrativeLead: "Long before the dhol beat echoed and the first aarti was sung, our festival began with highway rides, late-night planning, and boundless excitement.",
    narrativeBody: "From riding on the open truck to pick the perfect idol, to crafting the mandap drapery, hanging the golden lights, and transforming our place into a divine sanctum — our hands got dirty, but our hearts were completely full.",
    mainVisual: {
      id: "prep_main_showcase",
      src: "assets/images/real_gang_pandal_wide.jpg",
      title: "Setting Up The Sacred Mandap",
      tag: "Pandal Setup • Day 0",
      caption: "Our decorated mandap with intricate fabric drapes and radiant lighting ready for Bappa."
    },
    features: [
      {
        icon: "🛕",
        title: "Mandap Crafting",
        desc: "Fabric drapes, patterned backdrops, and hours of teamwork."
      },
      {
        icon: "🚛",
        title: "Highway Road Trip",
        desc: "Riding in the open truck together to bring Bappa home."
      },
      {
        icon: "✨",
        title: "Fairy Light Magic",
        desc: "Warm glowing lights that illuminated our sanctum."
      },
      {
        icon: "🤝",
        title: "Brotherhood & Smiles",
        desc: "Arguing over every small detail, but always laughing together."
      }
    ]
  },

  // 3. CHRONOLOGICAL FESTIVAL TIMELINE
  timeline: [
    {
      id: "stage-1",
      step: "01",
      badge: "The Journey",
      title: "The Road Trip to Bring Bappa",
      date: "Day 0 • Highway Morning",
      desc: "Riding in the open truck with the wind in our faces, excited to welcome Lord Ganesha.",
      imgSrc: "assets/images/video_thumb_highway_roadtrip.jpg",
      photoTag: "The Road Trip",
      caption: "Cruising along the highway together to pick up and bring home our beloved Bappa."
    },
    {
      id: "stage-2",
      step: "02",
      badge: "The Hard Work",
      title: "Preparations & Mandap Setup",
      date: "Day 0 • Evening & Night",
      desc: "Arranging the grand decorative drapery, hanging fairy lights, and setting up the sound system.",
      imgSrc: "assets/images/real_gang_pandal_wide.jpg",
      photoTag: "Mandap Setup",
      caption: "When everyone contributed their effort to make the mandap look divine and grand."
    },
    {
      id: "stage-3",
      step: "03",
      badge: "The Grand Arrival",
      title: "Bappa Arrives! (Aagman)",
      date: "Chaturthi Morning • 08:30 AM",
      desc: "The clay idol covered in sacred cloth, chants of 'Ganpati Bappa Morya' resonating, and carrying Bappa on our shoulders.",
      imgSrc: "assets/images/video_thumb_grand_aagman.jpg",
      photoTag: "Idol Arrival",
      caption: "Carrying Bappa with immense pride, brotherhood, and pure devotion."
    },
    {
      id: "stage-4",
      step: "04",
      badge: "Annadanam Feast",
      title: "The Grand Annadanam Feast & Prasad",
      date: "Festival Days • Community Feast",
      desc: "Cooking and serving the giant handi of delicious Annadanam feast and prasad to the entire community with pure love.",
      imgSrc: "assets/images/video_thumb_food_prasad_feast.jpg",
      photoTag: "Annadanam Feast",
      caption: "Serving piping hot prasad and meals to everyone in the neighborhood with joy."
    },
    {
      id: "stage-5",
      step: "05",
      badge: "Pure Energy",
      title: "DJ Night & Celebration Dance",
      date: "Festival Nights • 09:00 PM - Late",
      desc: "Flashing disco lights, electrifying beats, and dancing non-stop with the gang.",
      imgSrc: "assets/images/video_thumb_dj_night_celebration.jpg",
      photoTag: "DJ Night Dance",
      caption: "High energy dancing and joy under the festival lights."
    },
    {
      id: "stage-6",
      step: "06",
      badge: "Friendship",
      title: "Candid Smiles & Gang Memories",
      date: "Celebration Days • Unfiltered",
      desc: "The unscripted selfie moments, laughing together in front of the mandap, and making memories for life.",
      imgSrc: "assets/images/real_gang_selfie_bappa.jpg",
      photoTag: "Gang Selfie",
      caption: "Pure happiness and lifelong brotherhood with Lord Ganesha."
    },
    {
      id: "stage-7",
      step: "07",
      badge: "The Farewell",
      title: "The Memories We Keep (Visarjan)",
      date: "Visarjan Night • Sacred Immersion",
      desc: "Emotional chants, dancing along the procession truck, and gently letting Bappa return to the waters with prayers to come back soon.",
      imgSrc: "assets/images/video_thumb_visarjan_immersion.jpg",
      photoTag: "Visarjan Farewell",
      caption: "Pudhchya varshi lavkar ya — Come back soon next year, Bappa!"
    }
  ],

  // 4. MAIN MASONRY GALLERY ("THE MOMENTS WE DIDN'T PLAN")
  gallery: [
    {
      id: "gal-1",
      category: "group",
      title: "The Entire Gang at Mandap",
      caption: "All of us standing together beside Lord Ganesha in the illuminated mandap.",
      date: "Festive Evening",
      aspectRatio: "landscape",
      src: "assets/images/real_gang_pandal_mandap.jpg",
      tags: ["Gang", "Celebration", "Mandap"]
    },
    {
      id: "gal-2",
      category: "candid",
      title: "Bappa & The Boys Selfie",
      caption: "Close-up candid smiles with our beloved Lord Ganesha in the background.",
      date: "Candid Moment",
      aspectRatio: "landscape",
      src: "assets/images/real_gang_selfie_bappa.jpg",
      tags: ["Selfie", "Smiles", "Bappa"]
    },
    {
      id: "gal-3",
      category: "decor",
      title: "Lord Ganesha in Divine Glory",
      caption: "The golden crown, yellow pitambar, and radiant aura of our idol.",
      date: "Divine Darshan",
      aspectRatio: "portrait",
      src: "assets/images/real_ganesha_murti_hero.jpg",
      tags: ["Murti", "Divine", "Blessings"]
    },
    {
      id: "gal-4",
      category: "food",
      type: "video",
      title: "Annadanam Feast Preparation",
      caption: "Video memory: Preparing the giant handi of sacred Annadanam feast for the community.",
      date: "Annadanam Day",
      aspectRatio: "landscape",
      src: "assets/images/video_thumb_food_prasad_feast.jpg",
      videoUrl: "assets/videos/video_06_food_prasad_feast.mp4",
      tags: ["Food", "Annadanam", "Prasad", "Video"]
    },
    {
      id: "gal-5",
      category: "food",
      type: "video",
      title: "Community Prasad Distribution",
      caption: "Video memory: Serving hot meals and prasad with devotion to the community.",
      date: "Prasad Feast",
      aspectRatio: "landscape",
      src: "assets/images/video_thumb_pujadance_celebration.jpg",
      videoUrl: "assets/videos/video_07_pujadance_celebration.mp4",
      tags: ["Prasad", "Serving", "Devotion", "Video"]
    },
    {
      id: "gal-6",
      category: "visarjan",
      type: "video",
      title: "Highway Journey to Bring Bappa",
      caption: "Video memory: Riding on the open truck on the highway to pick up the idol.",
      date: "Day 0 Journey",
      aspectRatio: "landscape",
      src: "assets/images/video_thumb_highway_roadtrip.jpg",
      videoUrl: "assets/videos/video_01_highway_roadtrip.mp4",
      tags: ["RoadTrip", "Video", "Excitement"]
    },
    {
      id: "gal-7",
      category: "visarjan",
      type: "video",
      title: "Grand Aagman Arrival",
      caption: "Video memory: Carrying Lord Ganesha's idol covered in sacred cloth into our street.",
      date: "Aagman Morning",
      aspectRatio: "portrait",
      src: "assets/images/video_thumb_grand_aagman.jpg",
      videoUrl: "assets/videos/video_02_grand_aagman.mp4",
      tags: ["Aagman", "Video", "Procession"]
    },
    {
      id: "gal-8",
      category: "bloopers",
      type: "video",
      title: "Festival DJ Night Dance",
      caption: "Video memory: High energy dancing with the gang under the disco lights.",
      date: "Night Celebration",
      aspectRatio: "landscape",
      src: "assets/images/video_thumb_dj_night_celebration.jpg",
      videoUrl: "assets/videos/video_03_dj_night_celebration.mp4",
      tags: ["Dance", "Video", "DJNight"]
    },
    {
      id: "gal-9",
      category: "visarjan",
      type: "video",
      title: "Visarjan Street Procession",
      caption: "Video memory: Celebrating and dancing along the street with the music truck.",
      date: "Visarjan Day",
      aspectRatio: "landscape",
      src: "assets/images/video_thumb_visarjan_procession.jpg",
      videoUrl: "assets/videos/video_04_visarjan_procession_dance.mp4",
      tags: ["Visarjan", "Video", "Dance"]
    },
    {
      id: "gal-10",
      category: "visarjan",
      type: "video",
      title: "Sacred Visarjan Immersion",
      caption: "Video memory: Emotional night immersion in the sacred waters.",
      date: "Visarjan Night",
      aspectRatio: "portrait",
      src: "assets/images/video_thumb_visarjan_immersion.jpg",
      videoUrl: "assets/videos/video_05_sacred_visarjan_immersion.mp4",
      tags: ["Visarjan", "Video", "Farewell"]
    },
    {
      id: "gal-11",
      category: "candid",
      type: "video",
      title: "Neighborhood Festivities & Moments",
      caption: "Video memory: Daytime smiles, discussions, and neighborhood festive atmosphere.",
      date: "Festival Days",
      aspectRatio: "portrait",
      src: "assets/images/video_thumb_festival_moments.jpg",
      videoUrl: "assets/videos/video_08_festival_moments.mp4",
      tags: ["Neighborhood", "Candid", "Video"]
    },
    {
      id: "gal-12",
      category: "decor",
      title: "The Festive Pandal Atmosphere",
      caption: "Complete wide angle view of the fabric mandap, glowing lights, and setup.",
      date: "Mandap View",
      aspectRatio: "landscape",
      src: "assets/images/real_gang_pandal_wide.jpg",
      tags: ["Pandal", "Decorations", "Mandap"]
    },
    {
      id: "gal-13",
      category: "group",
      title: "Unfiltered Brotherhood & Memories",
      caption: "Moments of togetherness and joy in the pandal that we will cherish forever.",
      date: "Festival Memories",
      aspectRatio: "landscape",
      src: "assets/images/real_gang_candid_moments.jpg",
      tags: ["Friendship", "Memories", "Mandap"]
    }
  ],

  // 5. INSIDE JOKES & MEMORIES ("THINGS ONLY WE UNDERSTAND")
  insideJokes: [
    {
      id: "joke-1",
      icon: "🚛",
      stamp: "HIGHWAY HEROES",
      title: "The Open Truck Windstorm",
      handwritten: "“Holding onto the truck railings on the highway while the wind blew everyone’s hair into crazy shapes!”",
      tag: "Road Trip Champions",
      rotation: "-1.8deg"
    },
    {
      id: "joke-2",
      icon: "🍲",
      stamp: "CHEF SPECIAL",
      title: "The Giant Handi Mystery",
      handwritten: "“Stirring a 50kg rice pot with a giant paddle like we were rowing a boat down the river!”",
      tag: "MasterChef Gang",
      rotation: "2.5deg"
    },
    {
      id: "joke-3",
      icon: "💃",
      stamp: "DJ FLOOR BOSS",
      title: "The Non-Stop DJ Night Dance",
      handwritten: "“Said we would dance for 10 minutes. 2 hours later under the blue lights, shirts soaked, still jumping!”",
      tag: "Dance Floor Kings",
      rotation: "-1.5deg"
    },
    {
      id: "joke-4",
      icon: "☕",
      stamp: "2:30 AM RUN",
      title: "The Midnight Pandal Hangouts",
      handwritten: "“Solving all world problems, discussing future dreams, and laughing about old memories inside the pandal.”",
      tag: "Night Vigil Crew",
      rotation: "1.8deg"
    },
    {
      id: "joke-5",
      icon: "🌊",
      stamp: "IMMERSION MOMENT",
      title: "The Midnight Water Guard",
      handwritten: "“Standing together by the lake edge in the dark, chanting with full throat as Bappa took his sacred dip!”",
      tag: "Visarjan Squad",
      rotation: "-2.2deg"
    },
    {
      id: "joke-6",
      icon: "📸",
      stamp: "ONE MORE CLICK",
      title: "The 'Look At The Camera' Struggle",
      handwritten: "“Taking 50 group photos because in every shot, at least three people were looking somewhere else laughing!”",
      tag: "Photogenic Legends",
      rotation: "1.2deg"
    }
  ],

  // 6. FRIEND SPOTLIGHT ("THE GANG")
  friends: [
    {
      id: "friend-ramesh",
      name: "Ramesh",
      nickname: "The Gang",
      photos: ["assets/images/gang/gang_member_ramesh.jpg"],
      taggedMoments: ["gal-1", "gal-2", "gal-13"]
    },
    {
      id: "friend-pradeep",
      name: "Pradeep",
      nickname: "The Gang",
      photos: [
        "assets/images/gang/gang_member_pradeep.jpg",
        "assets/images/gang/real_gang_pradeep.jpg"
      ],
      taggedMoments: ["gal-1", "gal-2"]
    },
    {
      id: "friend-teja",
      name: "Teja",
      nickname: "The Gang",
      photos: [
        "assets/images/gang/gang_member_teja.jpg",
        "assets/images/gang/real_gang_teja.jpg"
      ],
      taggedMoments: ["gal-1", "gal-2", "gal-12"]
    },
    {
      id: "friend-charan",
      name: "Charan",
      nickname: "The Gang",
      photos: [
        "assets/images/gang/gang_member_charan.jpg",
        "assets/images/gang/real_gang_charan.jpg"
      ],
      taggedMoments: ["gal-1", "gal-2", "gal-11"]
    },
    {
      id: "friend-hamu",
      name: "Hamu",
      nickname: "The Gang",
      photos: [
        "assets/images/gang/gang_member_hamu.jpg",
        "assets/images/gang/real_gang_hamu.jpg"
      ],
      taggedMoments: ["gal-1", "gal-2"]
    },
    {
      id: "friend-narendra",
      name: "Narendra",
      nickname: "The Gang",
      photos: [
        "assets/images/gang/gang_member_narendra.jpg",
        "assets/images/gang/real_gang_narendra.jpg"
      ],
      taggedMoments: ["gal-1", "gal-2", "gal-3"]
    },
    {
      id: "friend-chinna",
      name: "Chinna",
      nickname: "The Gang",
      photos: [
        "assets/images/gang/gang_member_chinna.jpg",
        "assets/images/gang/real_gang_chinna.jpg"
      ],
      taggedMoments: ["gal-1", "gal-2", "gal-7"]
    },
    {
      id: "friend-committee",
      name: "Committee",
      nickname: "Utsav Committee",
      photos: [
        "assets/images/gang/gang_member_committee.jpg",
        "assets/images/gang/real_gang_committee.jpg"
      ],
      taggedMoments: ["gal-1", "gal-2", "gal-3", "gal-14"]
    },
    {
      id: "friend-sai-nikhil",
      name: "Sai Nikhil Raj Muppana",
      nickname: "Sai Nikhil",
      photos: [
        "assets/images/tribute/tribute_solo_smile_pines.jpg",
        "assets/images/tribute/tribute_solo_night_smile.jpg",
        "assets/images/tribute/tribute_group_araku_pinery.jpg"
      ],
      taggedMoments: ["gal-1", "gal-2"]
    }
  ],

  // 6B. TRIBUTE TO OUR BELOVED FRIEND ("FOREVER PART OF OUR MEMORIES")
  tribute: {
    badge: "In Loving Memory • Sai Nikhil Raj Muppana",
    title: "Forever Part of Our Memories",
    leadQuote: "“Some people become memories. Some memories become a part of who we are.”",
    messageHighlight: "Sai Nikhil may no longer be with us, but the moments we shared with him will always remain an inseparable part of who we are.",
    paragraphs: [
      "Every laugh, every celebration, every road trip, and every little memory reminds us that some people leave a permanent place in our hearts.",
      "This celebration is also for the memories we created together. Sai Nikhil, you will always be a part of our story, our brotherhood, and our memories."
    ],
    farewellMantra: "Forever remembered. Forever our brother. Forever Sai Nikhil.",
    photos: [
      {
        id: "tribute-main-ganesha",
        isMain: true,
        src: "assets/images/tribute/tribute_group_ganesha_celebration.jpg",
        title: "Marriage Celebration with the Entire Gang",
        caption: "All of us gathered together at the marriage celebration, sharing smiles, blessings, and lifelong brotherhood."
      },
      {
        id: "tribute-solo-pines",
        isMain: false,
        src: "assets/images/tribute/tribute_solo_smile_pines.jpg",
        title: "His Unforgettable Smile",
        caption: "Always bringing warmth, peace, and happiness to everyone around him."
      },
      {
        id: "tribute-solo-night",
        isMain: false,
        src: "assets/images/tribute/tribute_solo_night_smile.jpg",
        title: "Moments of Pure Joy",
        caption: "Laughter, warmth, and memories that time can never erase."
      },
      {
        id: "tribute-group-araku",
        isMain: false,
        src: "assets/images/tribute/tribute_group_araku_pinery.jpg",
        title: "Our Araku Pinery Road Trip",
        caption: "Standing together shoulder to shoulder across all our journeys."
      },
      {
        id: "tribute-video-celebration",
        isMain: false,
        type: "video",
        src: "assets/images/tribute/tribute_video_poster.jpg",
        videoUrl: "assets/videos/tribute_friend_memory_video.mp4",
        title: "Celebration Dance & Endless Joy",
        caption: "Dancing, smiling, and celebrating life together with the gang."
      }
    ]
  },

  // 7. EMOTIONAL STORYTELLING ("IF YOU REMEMBER THIS...")
  emotionalStories: [
    {
      id: "story-1",
      tag: "Memory 01",
      quote: "“We laughed until our stomachs hurt.”",
      subtext: "Standing together with wide smiles in front of Bappa, forgetting all our worries.",
      bgImage: "assets/images/real_gang_selfie_bappa.jpg"
    },
    {
      id: "story-2",
      tag: "Memory 02",
      quote: "“We stayed together until the stars faded.”",
      subtext: "The quiet hours in the pandal when the town slept, but our friendship felt boundless.",
      bgImage: "assets/images/real_gang_pandal_wide.jpg"
    },
    {
      id: "story-3",
      tag: "Memory 03",
      quote: "“We didn't realize these were the days we would miss.”",
      subtext: "Lifting Bappa during the grand arrival, singing chants with unison voices.",
      bgImage: "assets/images/video_thumb_grand_aagman.jpg"
    },
    {
      id: "story-4",
      tag: "Memory 04",
      quote: "“Some ordinary moments became our favorite memories.”",
      subtext: "Standing by the waters at night during visarjan, wishing time would pause just for a little while.",
      bgImage: "assets/images/video_thumb_visarjan_immersion.jpg"
    }
  ],

  // 8. VIDEO MEMORIES ("MOTION & MELODIES")
  videos: [
    {
      id: "vid-1",
      title: "Highway Journey to Bring Bappa",
      desc: "Cruising on the open truck along the highway to bring Lord Ganesha home.",
      thumb: "assets/images/video_thumb_highway_roadtrip.jpg",
      duration: "00:17",
      videoUrl: "assets/videos/video_01_highway_roadtrip.mp4"
    },
    {
      id: "vid-2",
      title: "The Grand Aagman Arrival",
      desc: "Carrying Lord Ganesha's idol covered in sacred cloth into our lane.",
      thumb: "assets/images/video_thumb_grand_aagman.jpg",
      duration: "00:44",
      videoUrl: "assets/videos/video_02_grand_aagman.mp4"
    },
    {
      id: "vid-3",
      title: "Community Annadanam Feast Preparation",
      desc: "Stirring the giant cooking handi of sacred Annadanam feast for all devotees.",
      thumb: "assets/images/video_thumb_food_prasad_feast.jpg",
      duration: "00:20",
      videoUrl: "assets/videos/video_06_food_prasad_feast.mp4"
    },
    {
      id: "vid-4",
      title: "Prasad & Meal Distribution",
      desc: "Serving meals and prasad with devotion to the community.",
      thumb: "assets/images/video_thumb_pujadance_celebration.jpg",
      duration: "00:21",
      videoUrl: "assets/videos/video_07_pujadance_celebration.mp4"
    },
    {
      id: "vid-5",
      title: "DJ Night & Celebration Dance",
      desc: "Dancing with boundless energy under the flashing celebration lights.",
      thumb: "assets/images/video_thumb_dj_night_celebration.jpg",
      duration: "00:26",
      videoUrl: "assets/videos/video_03_dj_night_celebration.mp4"
    },
    {
      id: "vid-6",
      title: "Visarjan Street Procession",
      desc: "Dancing along the street with the music truck during the procession.",
      thumb: "assets/images/video_thumb_visarjan_procession.jpg",
      duration: "00:16",
      videoUrl: "assets/videos/video_04_visarjan_procession_dance.mp4"
    },
    {
      id: "vid-7",
      title: "Sacred Visarjan Immersion",
      desc: "The heartfelt night farewell and water immersion with promises to return.",
      thumb: "assets/images/video_thumb_visarjan_immersion.jpg",
      duration: "01:19",
      videoUrl: "assets/videos/video_05_sacred_visarjan_immersion.mp4"
    },
    {
      id: "vid-8",
      title: "Neighborhood Festivities",
      desc: "Daytime celebration talks and neighborhood festive moments.",
      thumb: "assets/images/video_thumb_festival_moments.jpg",
      duration: "00:26",
      videoUrl: "assets/videos/video_08_festival_moments.mp4"
    }
  ],

  // 9. MEMORY WALL INITIAL POSTS
  memoryWallInitial: [
    {
      id: "msg-1",
      author: "Charan",
      role: "Mandap & Gang",
      category: "Favorite Moment",
      message: "మనందరం కలిసి బాప్పాను ఎత్తిన ఆ క్షణం, గల్లీ మొత్తం 'గణపతి బప్పా మోరియా' అని మార్మోగిన ఆ అనుభూతి ఎప్పటికీ మర్చిపోలేం! That pure energy gave us goosebumps! 🙏",
      sticker: "🙏",
      likes: 24,
      date: "Festival Memory"
    },
    {
      id: "msg-2",
      author: "గల్లీ పెద్దలు (Elder Uncle)",
      role: "Street Elder",
      category: "Blessings & Wishes",
      message: "పిల్లలు, కుర్రాళ్ళంతా ఇంత ఐకమత్యంగా పందిరి వేసి, అన్నదానం జరిపించిన విధానం చాలా సంతోషాన్నిచ్చింది. మన వీధిపై బాప్పా ఆశీస్సులు ఎల్లప్పుడూ ఉండాలి. May God bless you all with success and good health! 🪔",
      sticker: "🪔",
      likes: 31,
      date: "Festival Memory"
    },
    {
      id: "msg-3",
      author: "Rahul & Crew",
      role: "Road Trip Gang",
      category: "Favorite Moment",
      message: "ఓపెన్ ట్రక్కులో బాప్పాను తీసుకురావడం, హైవే గాలి, గట్టిగా పాటలు పాడటం... ఆ రోడ్ ట్రిప్ ఎప్పటికీ ఒక అందమైన జ్ఞాపకం! Cruising on the highway together was epic! 🥁",
      sticker: "🥁",
      likes: 19,
      date: "Festival Memory"
    },
    {
      id: "msg-4",
      author: "DJ Floor Dynamo",
      role: "Street Youth",
      category: "Funniest Incident",
      message: "DJ Night లో 5 నిమిషాలు అన్నవాళ్ళం కాళ్ళు నొప్పులు పుట్టేంతవరకు నాన్-స్టాప్ డాన్స్ చేశాం! We said 5 minutes and danced till midnight! ✨",
      sticker: "✨",
      likes: 28,
      date: "Festival Memory"
    },
    {
      id: "msg-5",
      author: "The Gang & Friends",
      role: "Friends Forever",
      category: "Message to Gang",
      message: "మనమంతా ఎక్కడున్నా, ఎంత బిజీగా ఉన్నా... ప్రతి వినాయక చవితికి మన గల్లీలో ఒక్కసారైనా కలవాలి. మన బంధం ఎప్పటికీ ఇలాగే నిలవాలి! Friends forever ❤️",
      sticker: "❤️",
      likes: 36,
      date: "Timeless Bond"
    }
  ],

  // 10. THE FINALE
  finale: {
    bgImage: "assets/images/real_gang_pandal_mandap.jpg",
    lines: [
      "Maybe next year we will celebrate again.",
      "Maybe things will be different.",
      "Maybe everyone will be busy.",
      "But we will always have these memories."
    ],
    salutation: "Until the next Chaturthi…",
    mantra: "Ganpati Bappa Morya 🙏",
    replayButton: "Replay Our Memories"
  }
};
