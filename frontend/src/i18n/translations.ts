export type LangCode = "en" | "hi" | "ne" | "bn";

export const LANGUAGES: { code: LangCode; label: string; speechLang: string }[] = [
  { code: "en", label: "English", speechLang: "en-IN" },
  { code: "hi", label: "हिन्दी", speechLang: "hi-IN" },
  { code: "ne", label: "नेपाली", speechLang: "ne-NP" },
  { code: "bn", label: "বাংলা", speechLang: "bn-IN" },
];

// Add a language by adding one more column to every row below (and one row
// to LANGUAGES above) -- nothing else in the app needs to change.
type Dict = Record<string, Record<LangCode, string>>;

export const T: Dict = {
  appName: { en: "JALRAKSHAK AI", hi: "जलरक्षक AI", ne: "जलरक्षक AI", bn: "জলরক্ষক AI" },
  citizenAlert: { en: "Citizen Alert", hi: "नागरिक अलर्ट", ne: "नागरिक अलर्ट", bn: "নাগরিক সতর্কতা" },
  live: { en: "LIVE", hi: "लाइव", ne: "लाइभ", bn: "লাইভ" },
  connecting: { en: "Connecting…", hi: "जुड़ रहा है…", ne: "जडान हुँदैछ…", bn: "সংযোগ হচ্ছে…" },
  waitingForData: {
    en: "Waiting for live data from the command center…",
    hi: "कमांड सेंटर से लाइव डेटा की प्रतीक्षा…",
    ne: "कमाण्ड सेन्टरबाट लाइभ डाटा पर्खँदै…",
    bn: "কমান্ড সেন্টার থেকে লাইভ ডেটার অপেক্ষা…",
  },

  floodAlert: { en: "🚨 FLOOD ALERT", hi: "🚨 बाढ़ चेतावनी", ne: "🚨 बाढी चेतावनी", bn: "🚨 বন্যা সতর্কতা" },
  floodWarning: { en: "⚠ FLOOD WARNING", hi: "⚠ बाढ़ चेतावनी", ne: "⚠ बाढी सावधानी", bn: "⚠ বন্যা সতর্কীকরণ" },
  floodWatch: { en: "⚠ FLOOD WATCH", hi: "⚠ बाढ़ निगरानी", ne: "⚠ बाढी निगरानी", bn: "⚠ বন্যা পর্যবেক্ষণ" },
  damMonitoring: { en: "DAM UNDER MONITORING", hi: "बांध की निगरानी जारी", ne: "बाँध अनुगमनमा", bn: "বাঁধ পর্যবেক্ষণে" },
  allClear: { en: "ALL CLEAR", hi: "सब सुरक्षित", ne: "सबै सुरक्षित", bn: "সব পরিষ্কার" },

  yourArea: { en: "YOUR AREA", hi: "आपका क्षेत्र", ne: "तपाईंको क्षेत्र", bn: "আপনার এলাকা" },
  changeArea: { en: "change", hi: "बदलें", ne: "परिवर्तन", bn: "পরিবর্তন" },
  floodExpected: { en: "FLOOD EXPECTED", hi: "बाढ़ की संभावना", ne: "बाढी अपेक्षित", bn: "বন্যার সম্ভাবনা" },
  minutes: { en: "minutes", hi: "मिनट", ne: "मिनेट", bn: "মিনিট" },
  min: { en: "min", hi: "मिनट", ne: "मिनेट", bn: "মিনিট" },
  modelEstimate: { en: "Model Estimate", hi: "अनुमानित", ne: "अनुमानित", bn: "আনুমানিক" },

  evacuateTo: { en: "EVACUATE TO", hi: "यहाँ जाएं", ne: "यहाँ जानुहोस्", bn: "এখানে যান" },
  goTo: { en: "GO TO", hi: "यहाँ जाएं", ne: "यहाँ जानुहोस्", bn: "এখানে যান" },
  travelTime: { en: "TRAVEL TIME", hi: "यात्रा समय", ne: "यात्रा समय", bn: "ভ্রমণ সময়" },
  safetyBuffer: { en: "SAFETY BUFFER", hi: "सुरक्षा समय", ne: "सुरक्षा समय", bn: "নিরাপত্তা সময়" },
  away: { en: "away", hi: "दूर", ne: "टाढा", bn: "দূরে" },

  status: { en: "STATUS", hi: "स्थिति", ne: "स्थिति", bn: "অবস্থা" },
  goNow: { en: "GO NOW", hi: "अभी जाएं", ne: "अहिले नै जानुहोस्", bn: "এখনই যান" },
  evacuateNow: { en: "EVACUATE NOW", hi: "अभी निकलें", ne: "अहिले नै निकासा गर्नुहोस्", bn: "এখনই সরে যান" },
  prepareToEvacuate: { en: "PREPARE TO EVACUATE", hi: "निकलने की तैयारी करें", ne: "निकासाको तयारी गर्नुहोस्", bn: "সরে যাওয়ার প্রস্তুতি নিন" },
  leaveImmediately: { en: "LEAVE IMMEDIATELY", hi: "तुरंत निकलें", ne: "तुरुन्तै निकासा गर्नुहोस्", bn: "অবিলম্বে চলে যান" },
  monitorSituation: { en: "MONITOR SITUATION", hi: "स्थिति पर नज़र रखें", ne: "अवस्था हेर्नुहोस्", bn: "পরিস্থিতি পর্যবেক্ষণ করুন" },
  stayAlert: { en: "STAY ALERT", hi: "सतर्क रहें", ne: "सतर्क रहनुहोस्", bn: "সতর্ক থাকুন" },
  noActionNeeded: { en: "No evacuation required", hi: "निकासी की आवश्यकता नहीं", ne: "निकासा आवश्यक छैन", bn: "সরে যাওয়ার প্রয়োজন নেই" },

  startSafeRoute: { en: "START SAFE ROUTE", hi: "सुरक्षित मार्ग शुरू करें", ne: "सुरक्षित मार्ग सुरु गर्नुहोस्", bn: "নিরাপদ পথ শুরু করুন" },
  viewSafestRoute: { en: "VIEW SAFEST ROUTE", hi: "सबसे सुरक्षित मार्ग देखें", ne: "सबैभन्दा सुरक्षित मार्ग हेर्नुहोस्", bn: "সবচেয়ে নিরাপদ পথ দেখুন" },
  recommendedRoute: { en: "RECOMMENDED ROUTE", hi: "अनुशंसित मार्ग", ne: "सिफारिस गरिएको मार्ग", bn: "প্রস্তাবিত পথ" },
  avoidFloodedRoads: {
    en: "Avoid flooded or closed roads.",
    hi: "बाढ़ग्रस्त या बंद सड़कों से बचें।",
    ne: "बाढी वा बन्द सडकहरू प्रयोग नगर्नुहोस्।",
    bn: "প্লাবিত বা বন্ধ রাস্তা এড়িয়ে চলুন।",
  },
  noRouteAvailable: { en: "No path available right now.", hi: "अभी कोई मार्ग उपलब्ध नहीं है।", ne: "अहिले कुनै मार्ग उपलब्ध छैन।", bn: "এই মুহূর্তে কোনো পথ পাওয়া যাচ্ছে না।" },

  readAloud: { en: "🔊 READ ALERT ALOUD", hi: "🔊 अलर्ट सुनें", ne: "🔊 अलर्ट सुन्नुहोस्", bn: "🔊 সতর্কতা শুনুন" },
  audioNotSupported: {
    en: "Audio alert is not supported on this device.",
    hi: "इस डिवाइस पर ऑडियो अलर्ट समर्थित नहीं है।",
    ne: "यो यन्त्रमा अडियो अलर्ट समर्थित छैन।",
    bn: "এই ডিভাইসে অডিও সতর্কতা সমর্থিত নয়।",
  },
  newEmergencyAlert: { en: "🔊 NEW EMERGENCY ALERT", hi: "🔊 नई आपातकालीन चेतावनी", ne: "🔊 नयाँ आपतकालीन चेतावनी", bn: "🔊 নতুন জরুরি সতর্কতা" },

  familyAlerts: { en: "FAMILY ALERTS", hi: "परिवार अलर्ट", ne: "परिवार अलर्ट", bn: "পরিবার সতর্কতা" },
  enabled: { en: "Enabled", hi: "सक्रिय", ne: "सक्रिय", bn: "সক্রিয়" },
  demoFamilyRegistry: { en: "DEMO FAMILY REGISTRY", hi: "डेमो परिवार रजिस्ट्री", ne: "डेमो परिवार रजिस्ट्री", bn: "ডেমো পরিবার রেজিস্ট্রি" },
  notifyAllFamily: { en: "Notify All Family Members", hi: "सभी सदस्यों को सूचित करें", ne: "सबै सदस्यलाई सूचित गर्नुहोस्", bn: "সব সদস্যকে জানান" },
  father: { en: "Father", hi: "पिता", ne: "बुबा", bn: "বাবা" },
  mother: { en: "Mother", hi: "माता", ne: "आमा", bn: "মা" },
  child: { en: "Child", hi: "बच्चा", ne: "बच्चा", bn: "সন্তান" },
  grandparent: { en: "Grandparent", hi: "दादा-दादी", ne: "हजुरबुबा/हजुरआमा", bn: "দাদা-দাদি" },
  safe: { en: "Safe", hi: "सुरक्षित", ne: "सुरक्षित", bn: "নিরাপদ" },
  prepare: { en: "Prepare", hi: "तैयार रहें", ne: "तयार हुनुहोस्", bn: "প্রস্তুত থাকুন" },
  evacuate: { en: "Evacuate", hi: "निकलें", ne: "निकासा", bn: "সরে যান" },
  identityNote: {
    en: "Identity verification / Aadhaar integration: future authorized government integration",
    hi: "पहचान सत्यापन / आधार एकीकरण: भविष्य में अधिकृत सरकारी एकीकरण",
    ne: "परिचय प्रमाणीकरण / आधार एकीकरण: भविष्यमा अधिकृत सरकारी एकीकरण",
    bn: "পরিচয় যাচাই / আধার সংযুক্তি: ভবিষ্যতে অনুমোদিত সরকারি সংযুক্তি",
  },

  communityShelters: { en: "🏠 COMMUNITY SHELTERS", hi: "🏠 सामुदायिक आश्रय", ne: "🏠 सामुदायिक आश्रय", bn: "🏠 কমিউনিটি আশ্রয়" },
  nearbySafeSpaces: { en: "NEARBY SAFE SPACES", hi: "आस-पास सुरक्षित स्थान", ne: "नजिकैका सुरक्षित ठाउँहरू", bn: "কাছের নিরাপদ স্থান" },
  viewAll: { en: "View All", hi: "सभी देखें", ne: "सबै हेर्नुहोस्", bn: "সব দেখুন" },
  spaceAvailable: { en: "space available", hi: "जगह उपलब्ध", ne: "ठाउँ उपलब्ध", bn: "স্থান উপলব্ধ" },
  peopleCanShelterHere: { en: "people can shelter here", hi: "लोग यहाँ शरण ले सकते हैं", ne: "मानिसहरू यहाँ आश्रय लिन सक्छन्", bn: "মানুষ এখানে আশ্রয় নিতে পারে" },
  currentlySafe: { en: "Currently safe", hi: "फिलहाल सुरक्षित", ne: "हाल सुरक्षित", bn: "বর্তমানে নিরাপদ" },
  verifyStatus: { en: "Verify before going", hi: "जाने से पहले पुष्टि करें", ne: "जानुअघि पुष्टि गर्नुहोस्", bn: "যাওয়ার আগে যাচাই করুন" },
  unsafeStatus: { en: "No longer safe", hi: "अब सुरक्षित नहीं", ne: "अब सुरक्षित छैन", bn: "আর নিরাপদ নয়" },
  full: { en: "FULL", hi: "भरा हुआ", ne: "भरिएको", bn: "পূর্ণ" },
  badgeSafe: { en: "✓ SAFE", hi: "✓ सुरक्षित", ne: "✓ सुरक्षित", bn: "✓ নিরাপদ" },
  badgeVerify: { en: "⚠ VERIFY", hi: "⚠ पुष्टि करें", ne: "⚠ पुष्टि गर्नुहोस्", bn: "⚠ যাচাই করুন" },
  badgeUnsafe: { en: "🔴 UNSAFE", hi: "🔴 असुरक्षित", ne: "🔴 असुरक्षित", bn: "🔴 অনিরাপদ" },
  communityReported: { en: "COMMUNITY REPORTED", hi: "समुदाय द्वारा सूचित", ne: "समुदायद्वारा रिपोर्ट गरिएको", bn: "কমিউনিটি রিপোর্টেড" },
  unverified: { en: "UNVERIFIED", hi: "असत्यापित", ne: "अप्रमाणित", bn: "অযাচাইকৃত" },
  authorityVerified: { en: "✓ AUTHORITY VERIFIED", hi: "✓ प्राधिकरण सत्यापित", ne: "✓ अधिकारीद्वारा प्रमाणित", bn: "✓ কর্তৃপক্ষ যাচাইকৃত" },
  noHotspotsNearby: { en: "No community safe spaces reported near you yet.", hi: "अभी आपके पास कोई सामुदायिक सुरक्षित स्थान नहीं है।", ne: "अहिलेसम्म तपाईं नजिक कुनै सामुदायिक सुरक्षित ठाउँ रिपोर्ट भएको छैन।", bn: "আপনার কাছাকাছি এখনও কোনো কমিউনিটি নিরাপদ স্থান রিপোর্ট করা হয়নি।" },

  canYouProvideShelter: { en: "➕ CAN YOU PROVIDE SHELTER?", hi: "➕ क्या आप आश्रय दे सकते हैं?", ne: "➕ के तपाईं आश्रय दिन सक्नुहुन्छ?", bn: "➕ আপনি কি আশ্রয় দিতে পারবেন?" },
  haveASafeSpace: {
    en: "Have a safe place where people can temporarily shelter?",
    hi: "क्या आपके पास कोई सुरक्षित स्थान है जहाँ लोग अस्थायी रूप से शरण ले सकें?",
    ne: "के तपाईंसँग सुरक्षित ठाउँ छ जहाँ मानिसहरूले अस्थायी आश्रय लिन सक्छन्?",
    bn: "আপনার কি এমন নিরাপদ জায়গা আছে যেখানে মানুষ সাময়িকভাবে আশ্রয় নিতে পারে?",
  },
  reportSafeSpace: { en: "REPORT A SAFE SPACE", hi: "सुरक्षित स्थान की सूचना दें", ne: "सुरक्षित ठाउँ रिपोर्ट गर्नुहोस्", bn: "একটি নিরাপদ স্থান রিপোর্ট করুন" },
  reportSafeSpaceBtn: { en: "+ REPORT SAFE SPACE", hi: "+ सुरक्षित स्थान दर्ज करें", ne: "+ सुरक्षित ठाउँ रिपोर्ट गर्नुहोस्", bn: "+ নিরাপদ স্থান রিপোর্ট করুন" },
  location: { en: "Location", hi: "स्थान", ne: "स्थान", bn: "অবস্থান" },
  useMyLocation: { en: "USE MY CURRENT LOCATION", hi: "मेरा वर्तमान स्थान उपयोग करें", ne: "मेरो हालको स्थान प्रयोग गर्नुहोस्", bn: "আমার বর্তমান অবস্থান ব্যবহার করুন" },
  locationUnavailable: { en: "Location unavailable — using your selected area instead.", hi: "स्थान उपलब्ध नहीं — आपके चुने गए क्षेत्र का उपयोग किया जा रहा है।", ne: "स्थान उपलब्ध छैन — तपाईंले चयन गरेको क्षेत्र प्रयोग गरिँदैछ।", bn: "অবস্থান পাওয়া যায়নি — আপনার নির্বাচিত এলাকা ব্যবহার করা হচ্ছে।" },
  typeOfSpace: { en: "Type of space", hi: "स्थान का प्रकार", ne: "ठाउँको प्रकार", bn: "স্থানের ধরন" },
  spaceType_home: { en: "Home", hi: "घर", ne: "घर", bn: "বাড়ি" },
  spaceType_community_hall: { en: "Community Hall", hi: "सामुदायिक भवन", ne: "सामुदायिक भवन", bn: "কমিউনিটি হল" },
  spaceType_school: { en: "School", hi: "स्कूल", ne: "विद्यालय", bn: "স্কুল" },
  spaceType_religious_building: { en: "Religious Building", hi: "धार्मिक स्थल", ne: "धार्मिक भवन", bn: "ধর্মীয় ভবন" },
  spaceType_apartment: { en: "Apartment / Building", hi: "अपार्टमेंट / भवन", ne: "अपार्टमेन्ट / भवन", bn: "অ্যাপার্টমেন্ট / ভবন" },
  spaceType_public_building: { en: "Public Building", hi: "सार्वजनिक भवन", ne: "सार्वजनिक भवन", bn: "পাবলিক ভবন" },
  spaceType_other: { en: "Other", hi: "अन्य", ne: "अन्य", bn: "অন্যান্য" },
  estimatedCapacity: { en: "Estimated additional capacity", hi: "अनुमानित अतिरिक्त क्षमता", ne: "अनुमानित थप क्षमता", bn: "আনুমানিক অতিরিক্ত ধারণক্ষমতা" },
  spaceAvailableForMore: { en: "Space available for more people", hi: "अधिक लोगों के लिए जगह उपलब्ध", ne: "थप मानिसका लागि ठाउँ उपलब्ध", bn: "আরও মানুষের জন্য স্থান উপলব্ধ" },
  optionalContact: { en: "Optional contact / instructions", hi: "वैकल्पिक संपर्क / निर्देश", ne: "वैकल्पिक सम्पर्क / निर्देशन", bn: "ঐচ্ছিক যোগাযোগ / নির্দেশনা" },
  safetyConfirm: {
    en: "I confirm this location is currently safe and available for emergency shelter.",
    hi: "मैं पुष्टि करता/करती हूँ कि यह स्थान वर्तमान में सुरक्षित है और आपातकालीन आश्रय के लिए उपलब्ध है।",
    ne: "म पुष्टि गर्छु कि यो स्थान हाल सुरक्षित छ र आपतकालीन आश्रयका लागि उपलब्ध छ।",
    bn: "আমি নিশ্চিত করছি এই স্থানটি বর্তমানে নিরাপদ এবং জরুরি আশ্রয়ের জন্য উপলব্ধ।",
  },
  submitReport: { en: "+ REPORT SAFE SPACE", hi: "+ सुरक्षित स्थान दर्ज करें", ne: "+ सुरक्षित ठाउँ पेश गर्नुहोस्", bn: "+ নিরাপদ স্থান জমা দিন" },
  cancel: { en: "Cancel", hi: "रद्द करें", ne: "रद्द गर्नुहोस्", bn: "বাতিল করুন" },
  thankYouReport: { en: "Thank you — your safe space is now visible to nearby citizens.", hi: "धन्यवाद — आपका सुरक्षित स्थान अब आस-पास के नागरिकों को दिखाई देगा।", ne: "धन्यवाद — तपाईंको सुरक्षित ठाउँ अब नजिकैका नागरिकलाई देखिनेछ।", bn: "ধন্যবাদ — আপনার নিরাপদ স্থান এখন কাছাকাছি নাগরিকদের কাছে দৃশ্যমান।" },

  mySafeSpace: { en: "MY SAFE SPACE", hi: "मेरा सुरक्षित स्थान", ne: "मेरो सुरक्षित ठाउँ", bn: "আমার নিরাপদ স্থান" },
  open: { en: "OPEN", hi: "खुला", ne: "खुला", bn: "খোলা" },
  closed: { en: "CLOSED", hi: "बंद", ne: "बन्द", bn: "বন্ধ" },
  capacity: { en: "Capacity", hi: "क्षमता", ne: "क्षमता", bn: "ধারণক্ষমতা" },
  occupied: { en: "Occupied", hi: "भरा हुआ", ne: "ओगटिएको", bn: "দখলকৃত" },
  available: { en: "Available", hi: "उपलब्ध", ne: "उपलब्ध", bn: "উপলব্ধ" },
  updateCapacity: { en: "UPDATE CAPACITY", hi: "क्षमता अपडेट करें", ne: "क्षमता अपडेट गर्नुहोस्", bn: "ধারণক্ষমতা আপডেট করুন" },
  closeSpace: { en: "CLOSE SPACE", hi: "स्थान बंद करें", ne: "ठाउँ बन्द गर्नुहोस्", bn: "স্থান বন্ধ করুন" },

  viewRoute: { en: "VIEW ROUTE", hi: "मार्ग देखें", ne: "मार्ग हेर्नुहोस्", bn: "পথ দেখুন" },
  simulatedAlert: {
    en: "DEMO / SIMULATED ALERT — no real emergency broadcast is sent",
    hi: "डेमो / सिम्युलेटेड अलर्ट — कोई वास्तविक आपातकालीन प्रसारण नहीं भेजा गया",
    ne: "डेमो / सिमुलेटेड अलर्ट — कुनै वास्तविक आपतकालीन प्रसारण पठाइएको छैन",
    bn: "ডেমো / সিমুলেটেড সতর্কতা — কোনো প্রকৃত জরুরি সম্প্রচার পাঠানো হয়নি",
  },
  homeNav: { en: "Home", hi: "होम", ne: "होम", bn: "হোম" },
  sheltersNav: { en: "Shelters", hi: "आश्रय", ne: "आश्रय", bn: "আশ্রয়" },
  familyNav: { en: "Family", hi: "परिवार", ne: "परिवार", bn: "পরিবার" },
};

export function t(key: string, lang: LangCode): string {
  return T[key]?.[lang] ?? T[key]?.en ?? key;
}
