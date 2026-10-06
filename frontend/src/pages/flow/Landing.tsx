import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  ArrowDownRight,
  ArrowUpRight,
  BadgeCheck,
  Bot,
  Check,
  ChevronRight,
  CircleDot,
  Headphones,
  LineChart,
  Menu,
  MessageCircle,
  Mic,
  Play,
  ScanSearch,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Sprout,
  Users,
  Workflow,
  X,
} from 'lucide-react'
import { Button } from '@/components/ui/button'

type LanguageCode = 'en' | 'te' | 'hi'

const COPY: Record<LanguageCode, {
  announcement: string
  product: string
  worlds: string
  why: string
  login: string
  language: string
  cta: string
  eyebrow: string
  heroLead: string
  heroAccent: string
  heroBody: string
  heroPrimary: string
  heroSecondary: string
  proofOne: string
  proofTwo: string
  proofThree: string
  liveWorkspace: string
  todaysSignal: string
  healthy: string
  nextMove: string
  nextMoveBody: string
  listening: string
  domainsActive: string
  conversations: string
  resolved: string
  signals: string
  flowEyebrow: string
  flowTitle: string
  flowBody: string
  featureOne: string
  featureOneBody: string
  featureTwo: string
  featureTwoBody: string
  featureThree: string
  featureThreeBody: string
  worldsEyebrow: string
  worldsTitle: string
  worldsBody: string
  techBody: string
  agriBody: string
  explore: string
  rhythmEyebrow: string
  rhythmTitle: string
  rhythmBody: string
  stepOne: string
  stepOneBody: string
  stepTwo: string
  stepTwoBody: string
  stepThree: string
  stepThreeBody: string
  voiceEyebrow: string
  voiceTitle: string
  voiceBody: string
  transcript: string
  transcriptAnswer: string
  askPulse: string
  trustEyebrow: string
  trustTitle: string
  trustBody: string
  finalTitle: string
  finalBody: string
  finalCta: string
  footer: string
  createAccount: string
}> = {
  en: {
    announcement: 'One signal for every next move', product: 'Product', worlds: 'Two worlds', why: 'Why us', login: 'Log in', language: 'Language', cta: 'Get started',
    eyebrow: 'The operating layer for modern commerce', heroLead: 'Make every customer moment', heroAccent: 'move you forward.', heroBody: 'We connect the storefront, the conversation, and the work behind it — so your team can act with context instead of chasing tabs.', heroPrimary: 'Build your workspace', heroSecondary: 'See how it flows',
    proofOne: 'Multilingual by design', proofTwo: 'Commerce + care together', proofThree: 'AI that stays grounded', liveWorkspace: 'Live workspace', todaysSignal: "Today’s signal", healthy: 'Healthy rhythm', nextMove: 'Next best move', nextMoveBody: 'Follow up with Priya about her laptop shortlist.', listening: 'AI is listening', domainsActive: 'Across 2 active domains', conversations: 'Conversations', resolved: 'Resolved', signals: 'Signals',
    flowEyebrow: 'One clear operating rhythm', flowTitle: 'Less hunting. More knowing what to do next.', flowBody: 'Every piece of context lands where it is useful: product discovery, order care, crop guidance, support, and the handoff between them.', featureOne: 'See the signal', featureOneBody: 'Turn customer intent, order health, and operational friction into a live picture your team can trust.', featureTwo: 'Keep it human', featureTwoBody: 'Give people a helpful voice and a clear path to a real person when the moment needs it.', featureThree: 'Move together', featureThreeBody: 'Bring support, commerce, and operations into one shared line of sight.',
    worldsEyebrow: 'Two worlds, one platform.', worldsTitle: 'Different work. Same clarity.', worldsBody: 'Choose the experience that fits your day. We keep the intelligence connected without flattening what makes each world different.', techBody: 'Discover, compare, buy, and get help with everyday technology — with the right context beside every decision.', agriBody: 'Track crops, understand field issues, find practical supplies, and get advice that respects the work on the ground.', explore: 'Explore the experience',
    rhythmEyebrow: 'Designed for the handoff', rhythmTitle: 'A calmer path from question to action.', rhythmBody: 'We make the in-between moments visible, so nothing gets lost between a customer, a farmer, and the team helping them.', stepOne: 'Capture the moment', stepOneBody: 'Text, voice, orders, crop photos, and customer intent come together in context.', stepTwo: 'Understand the why', stepTwoBody: 'AI summarizes the signal, highlights the risk, and keeps uncertainty visible.', stepThree: 'Make the next move', stepThreeBody: 'Resolve, recommend, or hand off with a clear owner and a useful history.',
    voiceEyebrow: 'Ask it your way', voiceTitle: 'Your words. Your language. Your pace.', voiceBody: 'Type a question or hold to speak. It can meet people in English, Telugu, and Hindi — then keep the answer practical.', transcript: 'Can you find a laptop for editing and travel?', transcriptAnswer: 'I found three strong fits. The best balance is the MacBook Air M2: light for travel, enough power for editing, and covered by a one-year manufacturer warranty.', askPulse: 'Ask anything',
    trustEyebrow: 'A better default', trustTitle: 'Useful AI, with a human boundary.', trustBody: 'Private by default. Clear when it is unsure. Built to make people more capable, not less involved.', finalTitle: 'Give every next move a little more signal.', finalBody: 'Start with one workspace for your storefront, your field, and the people who keep both moving.', finalCta: 'Create your workspace', footer: 'Commerce, care, and field intelligence in one bright workspace.', createAccount: 'Create an account',
  },
  te: {
    announcement: 'ప్రతి తదుపరి అడుగుకు ఒకే స్పష్టమైన సిగ్నల్', product: 'ఉత్పత్తి', worlds: 'రెండు ప్రపంచాలు', why: 'మా గురించి', login: 'లాగిన్', language: 'భాష', cta: 'ప్రారంభించండి',
    eyebrow: 'ఆధునిక వాణిజ్యానికి ఆపరేటింగ్ లేయర్', heroLead: 'ప్రతి కస్టమర్ క్షణాన్ని', heroAccent: 'ముందుకు నడిపించండి.', heroBody: 'మేము మీ స్టోర్‌ఫ్రంట్, సంభాషణలు, వాటి వెనుక జరిగే పనిని కలుపుతాము — ట్యాబ్‌ల కోసం వెతకకుండా, పూర్తి సందర్భంతో పని చేయండి.', heroPrimary: 'మీ వర్క్‌స్పేస్ నిర్మించండి', heroSecondary: 'ఇది ఎలా పనిచేస్తుందో చూడండి',
    proofOne: 'బహుభాషలకు సిద్ధం', proofTwo: 'వాణిజ్యం + సహాయం ఒకేచోట', proofThree: 'నమ్మదగిన AI', liveWorkspace: 'లైవ్ వర్క్‌స్పేస్', todaysSignal: 'ఈరోజు సిగ్నల్', healthy: 'మంచి స్థితి', nextMove: 'తదుపరి ఉత్తమ అడుగు', nextMoveBody: 'ప్రియాతో ల్యాప్‌టాప్ ఎంపిక గురించి తిరిగి మాట్లాడండి.', listening: 'AI వింటోంది', domainsActive: '2 యాక్టివ్ డొమైన్‌లలో', conversations: 'సంభాషణలు', resolved: 'పరిష్కరించినవి', signals: 'సిగ్నల్స్',
    flowEyebrow: 'ఒక స్పష్టమైన పని రిథమ్', flowTitle: 'వెతకడం తక్కువ. తదుపరి పని ఏదో తెలుసుకోవడం ఎక్కువ.', flowBody: 'ఉత్పత్తి ఎంపిక, ఆర్డర్ సహాయం, పంట మార్గదర్శనం, సపోర్ట్ — ప్రతి సందర్భం ఉపయోగపడే చోటే కనిపిస్తుంది.', featureOne: 'సిగ్నల్ చూడండి', featureOneBody: 'కస్టమర్ ఉద్దేశం, ఆర్డర్ స్థితి, పని అడ్డంకులను ఒక నమ్మదగిన లైవ్ చిత్రంగా మార్చండి.', featureTwo: 'మానవంగా ఉండండి', featureTwoBody: 'ప్రజలకు సులభమైన వాయిస్ సహాయం ఇవ్వండి; అవసరమైనప్పుడు నిజమైన వ్యక్తికి స్పష్టంగా చేరండి.', featureThree: 'కలిసి ముందుకు సాగండి', featureThreeBody: 'సపోర్ట్, వాణిజ్యం, ఆపరేషన్స్‌ను ఒకే దృష్టిలోకి తీసుకురండి.',
    worldsEyebrow: 'రెండు ప్రపంచాలు, ఒకే వేదిక.', worldsTitle: 'పని వేరు. స్పష్టత ఒకటే.', worldsBody: 'మీ రోజుకు సరిపోయే అనుభవాన్ని ఎంచుకోండి. ప్రతి ప్రపంచం ప్రత్యేకతను కాపాడుతూ, తెలివైన సమాచారాన్ని అనుసంధానంగా ఉంచుతుంది.', techBody: 'రోజువారీ టెక్నాలజీని కనుగొని, పోల్చి, కొనండి — ప్రతి నిర్ణయానికి సరైన సందర్భం పక్కనే ఉంటుంది.', agriBody: 'పంటలను ట్రాక్ చేయండి, పొల సమస్యలను అర్థం చేసుకోండి, అవసరమైన సామగ్రిని కనుగొనండి, నేలమీద పనికి సరిపోయే సలహా పొందండి.', explore: 'అనుభవాన్ని చూడండి',
    rhythmEyebrow: 'సరైన హ్యాండాఫ్ కోసం', rhythmTitle: 'ప్రశ్న నుంచి చర్య వరకు ప్రశాంతమైన దారి.', rhythmBody: 'కస్టమర్, రైతు, వారికి సహాయం చేస్తున్న టీమ్ మధ్య ఏదీ మాయమవకుండా మధ్యలో జరిగే ప్రతిదాన్ని స్పష్టంగా చూపిస్తుంది.', stepOne: 'క్షణాన్ని నమోదు చేయండి', stepOneBody: 'టెక్స్ట్, వాయిస్, ఆర్డర్లు, పంట ఫోటోలు, కస్టమర్ ఉద్దేశం — అన్నీ సందర్భంతో కలుస్తాయి.', stepTwo: 'కారణాన్ని అర్థం చేసుకోండి', stepTwoBody: 'AI సిగ్నల్‌ను సారాంశం చేసి, ప్రమాదాన్ని చూపిస్తుంది; అనిశ్చితిని కూడా దాచదు.', stepThree: 'తదుపరి అడుగు వేయండి', stepThreeBody: 'స్పష్టమైన బాధ్యతతో పరిష్కరించండి, సూచించండి లేదా సరైన వ్యక్తికి పంపండి.',
    voiceEyebrow: 'మీకు నచ్చిన విధంగా అడగండి', voiceTitle: 'మీ మాటలు. మీ భాష. మీ వేగం.', voiceBody: 'ప్రశ్న టైప్ చేయండి లేదా మాట్లాడటానికి నొక్కి ఉంచండి. ఇది ఇంగ్లీష్, తెలుగు, హిందీలో మాట్లాడగలదు — సమాధానం మాత్రం ఉపయోగకరంగా ఉంటుంది.', transcript: 'ఎడిటింగ్ మరియు ప్రయాణానికి సరిపోయే ల్యాప్‌టాప్ దొరుకుతుందా?', transcriptAnswer: 'మూడు మంచి ఎంపికలు దొరికాయి. MacBook Air M2 ఉత్తమ సమతుల్యత: ప్రయాణానికి తేలిక, ఎడిటింగ్‌కు తగిన శక్తి, ఒక సంవత్సరం తయారీదారు వారంటీ.', askPulse: 'ఏదైనా అడగండి',
    trustEyebrow: 'మంచి డిఫాల్ట్', trustTitle: 'మానవ పరిమితులతో ఉపయోగకరమైన AI.', trustBody: 'డిఫాల్ట్‌గా ప్రైవేట్. తెలియనప్పుడు స్పష్టంగా చెబుతుంది. మనుషుల పాత్రను తగ్గించడానికి కాదు, వారిని మరింత శక్తివంతం చేయడానికి రూపొందించబడింది.', finalTitle: 'ప్రతి తదుపరి అడుగుకు కొంచెం ఎక్కువ సిగ్నల్ ఇవ్వండి.', finalBody: 'మీ స్టోర్‌ఫ్రంట్, మీ పొలం, రెండింటినీ కదిలించే ప్రజల కోసం ఒకే వర్క్‌స్పేస్‌తో ప్రారంభించండి.', finalCta: 'మీ వర్క్‌స్పేస్ సృష్టించండి', footer: 'వాణిజ్యం, సహాయం, ఫీల్డ్ ఇంటెలిజెన్స్ — ఒకే ప్రకాశవంతమైన వర్క్‌స్పేస్‌లో.', createAccount: 'ఖాతా సృష్టించండి',
  },
  hi: {
    announcement: 'हर अगले कदम के लिए एक साफ़ सिग्नल', product: 'उत्पाद', worlds: 'दो दुनिया', why: 'हमारे बारे में', login: 'लॉग इन', language: 'भाषा', cta: 'शुरू करें',
    eyebrow: 'आधुनिक कॉमर्स के लिए ऑपरेटिंग लेयर', heroLead: 'हर ग्राहक के पल को', heroAccent: 'अगले साफ़ कदम में बदलें।', heroBody: 'हम आपके स्टोरफ्रंट, बातचीत और उसके पीछे के काम को जोड़ते हैं — ताकि टीम टैब ढूँढने के बजाय पूरे संदर्भ के साथ काम करे।', heroPrimary: 'अपना वर्कस्पेस बनाएँ', heroSecondary: 'यह कैसे चलता है देखें',
    proofOne: 'बहुभाषी डिज़ाइन', proofTwo: 'कॉमर्स + सहायता साथ', proofThree: 'ज़मीन से जुड़ा AI', liveWorkspace: 'लाइव वर्कस्पेस', todaysSignal: 'आज का सिग्नल', healthy: 'अच्छी गति', nextMove: 'अगला बेहतर कदम', nextMoveBody: 'प्रिया से उसके लैपटॉप विकल्पों के बारे में फिर बात करें।', listening: 'AI सुन रहा है', domainsActive: '2 सक्रिय डोमेन में', conversations: 'बातचीत', resolved: 'हल किए गए', signals: 'सिग्नल',
    flowEyebrow: 'एक साफ़ काम करने की लय', flowTitle: 'कम खोजें। अगला काम ज़्यादा साफ़ देखें।', flowBody: 'उत्पाद खोज, ऑर्डर सहायता, फसल मार्गदर्शन और सपोर्ट — हर संदर्भ वहीं आता है जहाँ वह उपयोगी है।', featureOne: 'सिग्नल देखें', featureOneBody: 'ग्राहक की मंशा, ऑर्डर की स्थिति और काम की रुकावटों को एक भरोसेमंद लाइव तस्वीर में बदलें।', featureTwo: 'इंसानी बने रहें', featureTwoBody: 'लोगों को आसान वॉइस सहायता दें और ज़रूरत पड़ने पर असली व्यक्ति तक साफ़ रास्ता दें।', featureThree: 'साथ आगे बढ़ें', featureThreeBody: 'सपोर्ट, कॉमर्स और ऑपरेशंस को एक साझा नज़र में लाएँ।',
    worldsEyebrow: 'दो दुनिया, एक वेदिका.', worldsTitle: 'काम अलग। स्पष्टता एक।', worldsBody: 'अपने दिन के अनुसार अनुभव चुनें। हम हर दुनिया की खासियत बचाते हुए समझदारी से जानकारी जोड़ते हैं।', techBody: 'हर दिन की टेक्नोलॉजी खोजें, तुलना करें, खरीदें और मदद पाएँ — हर फैसले के साथ सही संदर्भ।', agriBody: 'फसल ट्रैक करें, खेत की समस्या समझें, ज़रूरी सामान पाएँ और ज़मीन से जुड़ी सलाह लें।', explore: 'अनुभव देखें',
    rhythmEyebrow: 'बेहतर हैंडऑफ के लिए', rhythmTitle: 'सवाल से कार्रवाई तक एक शांत रास्ता।', rhythmBody: 'ग्राहक, किसान और उनकी मदद कर रही टीम के बीच की कोई बात खो न जाए — हम बीच के हर पल को साफ़ करते हैं।', stepOne: 'पल को दर्ज करें', stepOneBody: 'टेक्स्ट, वॉइस, ऑर्डर, फसल की तस्वीर और ग्राहक की मंशा एक संदर्भ में जुड़ते हैं।', stepTwo: 'कारण समझें', stepTwoBody: 'AI सिग्नल का सार देता है, जोखिम दिखाता है और अनिश्चितता को छिपाता नहीं।', stepThree: 'अगला कदम लें', stepThreeBody: 'साफ़ जिम्मेदारी और उपयोगी इतिहास के साथ हल करें, सुझाव दें या आगे भेजें।',
    voiceEyebrow: 'अपने तरीके से पूछें', voiceTitle: 'आपके शब्द। आपकी भाषा। आपकी गति।', voiceBody: 'सवाल लिखें या बोलने के लिए दबाकर रखें। यह अंग्रेज़ी, हिंदी और तेलुगु में मिल सकता है — जवाब व्यावहारिक रहेगा।', transcript: 'क्या एडिटिंग और यात्रा के लिए अच्छा लैपटॉप मिल सकता है?', transcriptAnswer: 'तीन अच्छे विकल्प मिले। सबसे संतुलित MacBook Air M2 है: यात्रा के लिए हल्का, एडिटिंग के लिए सक्षम और एक साल की निर्माता वारंटी के साथ।', askPulse: 'कुछ भी पूछें',
    trustEyebrow: 'एक बेहतर डिफॉल्ट', trustTitle: 'इंसानी सीमा वाला उपयोगी AI।', trustBody: 'डिफॉल्ट रूप से निजी। अनिश्चित होने पर साफ़। लोगों की भूमिका घटाने के लिए नहीं, उन्हें बेहतर बनाने के लिए बनाया गया।', finalTitle: 'हर अगले कदम को थोड़ा ज़्यादा सिग्नल दें।', finalBody: 'अपने स्टोरफ्रंट, अपने खेत और दोनों को चलाने वाले लोगों के लिए एक वर्कस्पेस से शुरुआत करें।', finalCta: 'अपना वर्कस्पेस बनाएँ', footer: 'कॉमर्स, सहायता और फील्ड इंटेलिजेंस — एक उजले वर्कस्पेस में।', createAccount: 'खाता बनाएँ',
  },
}

export default function Landing() {
  const { i18n } = useTranslation()
  const [mobileOpen, setMobileOpen] = useState(false)
  const language = (i18n.language.startsWith('te') ? 'te' : i18n.language.startsWith('hi') ? 'hi' : 'en') as LanguageCode
  const copy = COPY[language]

  const changeLanguage = (next: LanguageCode) => {
    void i18n.changeLanguage(next)
    setMobileOpen(false)
  }

  return (
    <div className="landing-page app-page overflow-hidden">
      <div className="landing-announcement border-b border-(--color-border) bg-(--color-accent-lime) px-5 py-2.5 text-center text-[10px] font-semibold uppercase tracking-[0.16em] text-(--color-text)">
        <span className="mr-2 inline-block h-1.5 w-1.5 rounded-full bg-(--color-text) align-middle" /> {copy.announcement}
      </div>

      <header className="landing-nav sticky top-0 z-30 border-b border-(--color-border)/70 bg-(--color-bg)/85 px-5 backdrop-blur-xl sm:px-8 lg:px-12">
        <div className="mx-auto flex h-[76px] max-w-[1440px] items-center justify-between gap-4">
          <div className="hidden shrink-0 sm:block" />

          <nav className="hidden items-center gap-8 text-sm font-medium text-(--color-muted) lg:flex">
            <a href="#product" className="transition-colors hover:text-(--color-text)">{copy.product}</a>
            <a href="#worlds" className="transition-colors hover:text-(--color-text)">{copy.worlds}</a>
            <a href="#why-us" className="transition-colors hover:text-(--color-text)">{copy.why}</a>
          </nav>

          <div className="flex items-center gap-2 sm:gap-3">
            <label className="hidden items-center gap-2 rounded-full border border-(--color-border) bg-(--color-surface)/80 px-3 py-2 text-xs text-(--color-muted) sm:flex">
              <span className="sr-only">{copy.language}</span>
              <select value={language} onChange={(event) => changeLanguage(event.target.value as LanguageCode)} className="cursor-pointer appearance-none bg-transparent font-semibold outline-none" aria-label={copy.language}>
                <option value="en">EN</option>
                <option value="te">తెలుగు</option>
                <option value="hi">हिन्दी</option>
              </select>
            </label>
            <Link to="/login" className="hidden px-2 text-sm font-semibold text-(--color-text) sm:block">{copy.login}</Link>
            <Link to="/signup"><Button className="button-lime h-10 px-4 text-xs sm:px-5">{copy.cta} <ArrowUpRight size={14} /></Button></Link>
            <button type="button" className="flex h-10 w-10 items-center justify-center rounded-full border border-(--color-border) lg:hidden" onClick={() => setMobileOpen((open) => !open)} aria-label="Toggle menu" aria-expanded={mobileOpen}>{mobileOpen ? <X size={18} /> : <Menu size={18} />}</button>
          </div>
        </div>
        {mobileOpen && <div className="mx-auto flex max-w-[1440px] flex-col gap-1 border-t border-(--color-border) py-4 lg:hidden"><a href="#product" onClick={() => setMobileOpen(false)} className="rounded-xl px-3 py-3 text-sm font-semibold">{copy.product}</a><a href="#worlds" onClick={() => setMobileOpen(false)} className="rounded-xl px-3 py-3 text-sm font-semibold">{copy.worlds}</a><a href="#why-us" onClick={() => setMobileOpen(false)} className="rounded-xl px-3 py-3 text-sm font-semibold">{copy.why}</a></div>}
      </header>

      <main>
        <section className="landing-hero relative mx-auto grid max-w-[1440px] gap-12 px-5 pb-20 pt-14 sm:px-8 md:pt-20 lg:grid-cols-[0.9fr_1.1fr] lg:items-center lg:gap-12 lg:px-12 lg:pb-28">
          <div className="landing-hero-copy relative z-10 max-w-2xl">
            <div className="eyebrow mb-6 flex items-center gap-3"><span className="lime-dot" /> {copy.eyebrow}</div>
            <h1 className="display-heading max-w-3xl text-[clamp(3.6rem,7.4vw,7.6rem)] leading-[0.88]">{copy.heroLead} <em className="text-(--color-ecom-primary)">{copy.heroAccent}</em></h1>
            <p className="mt-8 max-w-xl text-base leading-7 text-(--color-muted) sm:text-lg">{copy.heroBody}</p>
            <div className="mt-9 flex flex-wrap items-center gap-3">
              <Link to="/signup"><Button size="lg" className="button-lime h-13 px-6">{copy.heroPrimary} <ArrowUpRight size={16} /></Button></Link>
              <a href="#product" className="group inline-flex h-13 items-center gap-2 rounded-full border border-(--color-border) bg-(--color-surface) px-5 text-sm font-semibold transition-all hover:-translate-y-0.5 hover:border-(--color-text)/30"><span className="flex h-7 w-7 items-center justify-center rounded-full bg-(--color-surface-2)"><Play size={12} fill="currentColor" /></span> {copy.heroSecondary}</a>
            </div>
            <div className="mt-10 grid max-w-lg grid-cols-1 gap-3 text-xs text-(--color-muted) sm:grid-cols-3">
              <TrustLine icon={Check} text={copy.proofOne} />
              <TrustLine icon={Check} text={copy.proofTwo} />
              <TrustLine icon={Check} text={copy.proofThree} />
            </div>
          </div>
          <SignalBoard copy={copy} />
          <div className="pointer-events-none absolute -left-20 top-24 h-64 w-64 rounded-full bg-(--color-accent-lime)/20 blur-3xl" />
          <div className="pointer-events-none absolute bottom-0 right-0 h-80 w-80 rounded-full bg-[#9ed7a3]/20 blur-3xl" />
        </section>

        <div className="landing-marquee overflow-hidden border-y border-(--color-border) bg-(--color-surface)"><div className="ticker-track gap-12 py-4 text-[10px] font-semibold uppercase tracking-[0.16em] text-(--color-muted)">{[copy.proofOne, copy.proofTwo, copy.proofThree, 'TechKart × AgriMart', copy.proofOne, copy.proofTwo, copy.proofThree].map((item, index) => <span key={`${item}-${index}`} className="flex items-center gap-12 whitespace-nowrap"><span className="h-1.5 w-1.5 rounded-full bg-(--color-accent-lime)" /> {item}</span>)}</div></div>

        <section id="product" className="mx-auto max-w-[1440px] px-5 py-20 sm:px-8 lg:px-12 lg:py-32">
          <div className="grid gap-8 lg:grid-cols-[0.76fr_1.24fr] lg:items-end"><div><div className="eyebrow mb-4">{copy.flowEyebrow}</div><h2 className="display-heading max-w-2xl text-5xl leading-[0.94] sm:text-7xl">{copy.flowTitle}</h2></div><p className="max-w-md justify-self-end text-base leading-7 text-(--color-muted)">{copy.flowBody}</p></div>
          <div className="mt-12 grid gap-4 md:grid-cols-12 md:grid-rows-2">
            <FeaturePanel className="md:col-span-7 md:row-span-2" eyebrow="01 / SIGNAL" title={copy.featureOne} icon={LineChart}>
              <div className="mt-8 rounded-2xl border border-(--color-border) bg-(--color-surface) p-4 sm:p-6"><div className="mb-7 flex items-start justify-between gap-4"><div><p className="metric-label">{copy.todaysSignal}</p><p className="mt-2 text-4xl font-semibold tracking-[-0.07em]">84.6 <span className="text-sm font-normal tracking-normal text-(--color-muted)">/ 100</span></p></div><span className="rounded-full bg-(--color-accent-lime) px-2.5 py-1 text-[10px] font-semibold">+12.4%</span></div><svg viewBox="0 0 600 170" className="h-40 w-full overflow-visible" role="img" aria-label="Customer signal trend"><defs><linearGradient id="pulse-fill-new" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor="#caff3d" stopOpacity="0.32" /><stop offset="1" stopColor="#caff3d" stopOpacity="0" /></linearGradient></defs><path d="M0 142 C52 136 57 92 106 111 S164 113 190 90 S244 118 275 78 S320 96 354 65 S400 83 430 48 S477 76 514 37 S555 46 600 14 V170 H0Z" fill="url(#pulse-fill-new)" /><path className="signal-line" d="M0 142 C52 136 57 92 106 111 S164 113 190 90 S244 118 275 78 S320 96 354 65 S400 83 430 48 S477 76 514 37 S555 46 600 14" fill="none" stroke="#0b6b4e" strokeLinecap="round" strokeWidth="4" /><circle cx="514" cy="37" r="7" fill="#caff3d" stroke="#0b6b4e" strokeWidth="3" /></svg><div className="mt-1 flex justify-between text-[10px] text-(--color-muted)"><span>Mon</span><span>Wed</span><span>Fri</span><span>Sun</span></div></div>
              <p className="mt-6 max-w-xl text-sm leading-6 text-(--color-muted)">{copy.featureOneBody}</p>
            </FeaturePanel>
            <FeaturePanel className="md:col-span-5" eyebrow="02 / CARE" title={copy.featureTwo} icon={MessageCircle} dark><div className="mt-7 flex items-center gap-3 rounded-2xl border border-white/15 bg-white/10 p-3"><span className="flex h-9 w-9 items-center justify-center rounded-full bg-(--color-accent-lime) text-(--color-text)"><Mic size={16} /></span><span className="flex-1 text-xs text-white/70">{copy.askPulse}</span><ChevronRight size={14} className="text-(--color-accent-lime)" /></div><p className="mt-5 text-sm leading-6 text-white/60">{copy.featureTwoBody}</p></FeaturePanel>
            <FeaturePanel className="md:col-span-5" eyebrow="03 / FLOW" title={copy.featureThree} icon={Users}><div className="mt-6 flex items-center gap-2"><Avatar label="AM" /><Avatar label="JS" /><Avatar label="RK" /><span className="ml-2 text-xs text-(--color-muted)">+ 12 teammates in flow</span></div><p className="mt-5 text-sm leading-6 text-(--color-muted)">{copy.featureThreeBody}</p></FeaturePanel>
          </div>
        </section>

        <section id="worlds" className="border-y border-(--color-border) bg-(--color-surface) px-5 py-20 sm:px-8 lg:px-12 lg:py-32"><div className="mx-auto max-w-[1440px]"><div className="eyebrow mb-4">{copy.worldsEyebrow}</div><div className="flex flex-col justify-between gap-6 md:flex-row md:items-end"><h2 className="display-heading max-w-3xl text-5xl leading-[0.94] sm:text-7xl">{copy.worldsTitle}</h2><p className="max-w-sm text-sm leading-6 text-(--color-muted)">{copy.worldsBody}</p></div><div className="mt-12 grid gap-5 lg:grid-cols-2"><DomainCard icon={ShoppingBag} eyebrow="TECHKART / COMMERCE" title="TechKart" copy={copy.techBody} link="/signup" accent="lime" explore={copy.explore} /><DomainCard icon={Sprout} eyebrow="AGRIMART / FIELD" title="AgriMart" copy={copy.agriBody} link="/signup" accent="leaf" explore={copy.explore} /></div></div></section>

        <section id="why-us" className="mx-auto grid max-w-[1440px] gap-12 px-5 py-20 sm:px-8 lg:grid-cols-[0.78fr_1.22fr] lg:px-12 lg:py-32"><div><div className="eyebrow mb-4">{copy.rhythmEyebrow}</div><h2 className="display-heading max-w-xl text-5xl leading-[0.94] sm:text-7xl">{copy.rhythmTitle}</h2><p className="mt-6 max-w-md text-base leading-7 text-(--color-muted)">{copy.rhythmBody}</p><Link to="/signup" className="site-link mt-8 inline-flex items-center gap-2 text-sm">{copy.heroPrimary} <ArrowUpRight size={15} /></Link></div><div className="grid gap-4 sm:grid-cols-3"><StepCard number="01" icon={ScanSearch} title={copy.stepOne} copy={copy.stepOneBody} /><StepCard number="02" icon={Workflow} title={copy.stepTwo} copy={copy.stepTwoBody} /><StepCard number="03" icon={ArrowDownRight} title={copy.stepThree} copy={copy.stepThreeBody} /></div></section>

        <section className="border-y border-(--color-border) bg-(--color-text) px-5 py-20 text-white sm:px-8 lg:px-12 lg:py-28"><div className="mx-auto grid max-w-[1440px] gap-12 lg:grid-cols-[0.78fr_1.22fr] lg:items-center"><div><div className="eyebrow text-(--color-accent-lime)">{copy.voiceEyebrow}</div><h2 className="display-heading mt-4 max-w-2xl text-5xl leading-[0.96] text-white sm:text-7xl">{copy.voiceTitle}</h2><p className="mt-6 max-w-md text-base leading-7 text-white/60">{copy.voiceBody}</p><Link to="/signup"><Button className="button-lime mt-8 h-12 px-5">{copy.askPulse} <ArrowUpRight size={16} /></Button></Link></div><VoiceDemo copy={copy} /></div></section>

        <section className="mx-auto max-w-[1440px] px-5 py-20 sm:px-8 lg:px-12 lg:py-32"><div className="grid gap-10 rounded-[2rem] border border-(--color-border) bg-(--color-surface-2) p-7 sm:p-10 lg:grid-cols-[0.85fr_1.15fr] lg:p-14"><div><div className="eyebrow mb-4">{copy.trustEyebrow}</div><h2 className="display-heading max-w-xl text-5xl leading-[0.95] sm:text-6xl">{copy.trustTitle}</h2><p className="mt-5 max-w-md text-base leading-7 text-(--color-muted)">{copy.trustBody}</p></div><div className="grid gap-3 sm:grid-cols-2"><Principle icon={ShieldCheck} title={language === 'en' ? 'Private by default' : language === 'te' ? 'డిఫాల్ట్‌గా ప్రైవేట్' : 'डिफॉल्ट रूप से निजी'} copy={language === 'en' ? 'The right context stays with the right person and domain.' : language === 'te' ? 'సరైన సందర్భం సరైన వ్యక్తి మరియు డొమైన్‌తోనే ఉంటుంది.' : 'सही संदर्भ सही व्यक्ति और डोमेन के साथ रहता है।'} /><Principle icon={Headphones} title={language === 'en' ? 'Support that listens' : language === 'te' ? 'వినే సపోర్ట్' : 'सुनने वाला सपोर्ट'} copy={language === 'en' ? 'Voice, chat, and service signals become an owned next step.' : language === 'te' ? 'వాయిస్, చాట్, సర్వీస్ సిగ్నల్స్ ఒక స్పష్టమైన తదుపరి అడుగుగా మారతాయి.' : 'वॉइस, चैट और सर्विस सिग्नल अगले साफ़ कदम में बदलते हैं।'} /><Principle icon={BadgeCheck} title={language === 'en' ? 'Clarity over magic' : language === 'te' ? 'మాయ కంటే స్పష్టత' : 'जादू से ज़्यादा स्पष्टता'} copy={language === 'en' ? 'AI keeps confidence and uncertainty visible.' : language === 'te' ? 'AI నమ్మకం మరియు అనిశ్చితిని స్పష్టంగా చూపిస్తుంది.' : 'AI भरोसे और अनिश्चितता दोनों को साफ़ रखता है।'} /><Principle icon={Sparkles} title={language === 'en' ? 'Useful by design' : language === 'te' ? 'ఉపయోగం కోసం డిజైన్' : 'उपयोग के लिए डिज़ाइन'} copy={language === 'en' ? 'Recommendations arrive with enough context to act.' : language === 'te' ? 'చర్య తీసుకోవడానికి సరిపడే సందర్భంతో సూచనలు వస్తాయి.' : 'सुझाव कार्रवाई के लिए पर्याप्त संदर्भ के साथ आते हैं।'} /></div></div></section>

        <section className="px-5 pb-20 sm:px-8 lg:px-12 lg:pb-32"><div className="landing-cta relative mx-auto max-w-[1440px] overflow-hidden rounded-[2rem] bg-(--color-accent-lime) px-7 py-12 sm:px-12 sm:py-16 lg:px-20"><div className="relative z-10 max-w-3xl"><p className="eyebrow text-(--color-text)">START HERE</p><h2 className="display-heading mt-4 text-5xl leading-[0.95] sm:text-7xl">{copy.finalTitle}</h2><p className="mt-5 max-w-xl text-base leading-7 text-(--color-text)/75">{copy.finalBody}</p><Link to="/signup"><Button className="mt-8 h-12 bg-(--color-text) px-5 text-white hover:bg-(--color-ecom-primary-hover)">{copy.finalCta} <ArrowUpRight size={16} /></Button></Link></div><div className="landing-cta-orbit absolute -right-20 -top-24 h-80 w-80 rounded-full border-[28px] border-(--color-text)/10" /><div className="landing-cta-orbit absolute -bottom-36 right-20 h-96 w-96 rounded-full border-[28px] border-(--color-text)/10" /></div></section>
      </main>

      <footer className="border-t border-(--color-border) bg-(--color-surface) px-5 py-8 sm:px-8 lg:px-12"><div className="mx-auto flex max-w-[1440px] flex-col justify-between gap-5 sm:flex-row sm:items-center"><div className="flex items-center gap-3"><span className="max-w-xs text-xs text-(--color-muted)">{copy.footer}</span></div><div className="flex items-center gap-5 text-xs text-(--color-muted)"><Link to="/login" className="hover:text-(--color-text)">{copy.login}</Link><Link to="/signup" className="hover:text-(--color-text)">{copy.createAccount}</Link><span>© {new Date().getFullYear()}</span></div></div></footer>
    </div>
  )
}

function TrustLine({ icon: Icon, text }: { icon: typeof Check; text: string }) { return <span className="flex items-center gap-2"><Icon size={14} className="shrink-0 text-(--color-ecom-primary)" /> <span>{text}</span></span> }

function SignalBoard({ copy }: { copy: typeof COPY.en }) {
  return <div className="landing-dashboard relative mx-auto w-full max-w-[650px] rounded-[2rem] border border-(--color-border) bg-(--color-surface-2) p-3 shadow-[0_35px_90px_-42px_rgba(25,61,42,0.5)] sm:p-5"><div className="app-grid rounded-[1.5rem] border border-(--color-border) bg-(--color-surface) p-4 sm:p-6"><div className="flex items-center justify-between"><div className="flex items-center gap-2"><span className="lime-dot" /><span className="metric-label">{copy.liveWorkspace}</span></div><span className="rounded-full border border-(--color-border) px-2.5 py-1 font-(family-name:--font-mono) text-[10px] text-(--color-muted)">09:41</span></div><div className="mt-7 flex items-end justify-between gap-4"><div><p className="metric-label">{copy.todaysSignal}</p><p className="mt-2 text-4xl font-semibold tracking-[-0.07em] sm:text-5xl">+28.4%</p></div><span className="mb-1 flex items-center gap-1.5 text-xs font-semibold text-(--color-ecom-primary)"><CircleDot size={13} /> {copy.healthy}</span></div><div className="mt-7 rounded-2xl bg-(--color-text) p-4 text-white sm:p-5"><div className="flex items-start justify-between"><div><p className="metric-label text-white/50">{copy.nextMove}</p><p className="mt-2 max-w-xs text-lg font-semibold leading-tight">{copy.nextMoveBody}</p></div><span className="flex h-9 w-9 items-center justify-center rounded-full bg-(--color-accent-lime) text-(--color-text)"><ArrowUpRight size={17} /></span></div><div className="mt-5 flex items-center gap-3 border-t border-white/15 pt-4"><span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#e9c5aa] text-[10px] font-bold text-(--color-text)">PS</span><div className="flex-1"><p className="text-xs font-semibold">Priya Shah</p><p className="text-[11px] text-white/55">Intent: comparing · sentiment: curious</p></div><span className="rounded-full bg-white/10 px-2 py-1 text-[10px] text-white/60">2m ago</span></div></div><div className="mt-4 grid grid-cols-3 gap-2"><MiniStat label={copy.conversations} value="42" change="+8" /><MiniStat label={copy.resolved} value="96%" change="+4.2" /><MiniStat label={copy.signals} value="18" change="new" /></div></div><div className="landing-float absolute -bottom-5 -left-5 hidden items-center gap-3 rounded-2xl border border-(--color-border) bg-(--color-surface) p-3 shadow-xl sm:flex"><span className="flex h-9 w-9 items-center justify-center rounded-full bg-(--color-accent-lime) text-(--color-text)"><Bot size={17} /></span><div><p className="text-xs font-semibold">{copy.listening}</p><p className="text-[10px] text-(--color-muted)">{copy.domainsActive}</p></div></div><div className="landing-orbit absolute -right-8 -top-8 hidden h-20 w-20 rounded-full border border-(--color-accent-lime)/60 sm:block" /></div>
}

function MiniStat({ label, value, change }: { label: string; value: string; change: string }) { return <div className="rounded-xl border border-white/10 bg-white/10 px-3 py-3"><p className="text-[10px] text-white/45">{label}</p><div className="mt-1 flex items-baseline justify-between gap-2"><span className="text-base font-semibold">{value}</span><span className="font-(family-name:--font-mono) text-[9px] text-(--color-accent-lime)">{change}</span></div></div> }

function FeaturePanel({ eyebrow, title, icon: Icon, children, dark = false, className = '' }: { eyebrow: string; title: string; icon: typeof LineChart; children?: React.ReactNode; dark?: boolean; className?: string }) { return <article className={`${className} overflow-hidden rounded-[1.75rem] border p-6 sm:p-8 ${dark ? 'border-(--color-text) bg-(--color-text) text-white' : 'border-(--color-border) bg-(--color-surface-2)'}`}><div className="flex items-start justify-between gap-4"><div><p className={`eyebrow ${dark ? 'text-(--color-accent-lime)' : ''}`}>{eyebrow}</p><h3 className="mt-3 max-w-sm text-2xl font-semibold leading-tight tracking-[-0.04em]">{title}</h3></div><span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${dark ? 'bg-(--color-accent-lime) text-(--color-text)' : 'bg-(--color-surface) text-(--color-ecom-primary)'}`}><Icon size={18} /></span></div>{children}</article> }

function Avatar({ label }: { label: string }) { return <span className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-(--color-surface-2) bg-(--color-text) text-[10px] font-semibold text-white first:ml-0 -ml-2">{label}</span> }

function DomainCard({ icon: Icon, eyebrow, title, copy, link, accent, explore }: { icon: typeof ShoppingBag; eyebrow: string; title: string; copy: string; link: string; accent: 'lime' | 'leaf'; explore: string }) { return <Link to={link} className="group relative min-h-[350px] overflow-hidden rounded-[1.75rem] border border-(--color-border) bg-(--color-surface-2) p-7 transition-all hover:-translate-y-1 hover:shadow-[0_22px_50px_-30px_rgba(25,61,42,0.4)] sm:p-9"><div className={`absolute -right-16 -top-16 h-56 w-56 rounded-full blur-3xl ${accent === 'leaf' ? 'bg-[#a8d47f]/45' : 'bg-(--color-accent-lime)/55'}`} /><div className="relative flex h-full flex-col"><div className="flex items-center justify-between"><span className="flex h-11 w-11 items-center justify-center rounded-full bg-(--color-surface) text-(--color-ecom-primary)"><Icon size={19} /></span><ArrowUpRight size={20} className="text-(--color-muted) transition-transform group-hover:-translate-y-1 group-hover:translate-x-1" /></div><p className="eyebrow mt-10">{eyebrow}</p><h3 className="display-heading mt-2 text-5xl">{title}</h3><p className="mt-4 max-w-md text-sm leading-6 text-(--color-muted)">{copy}</p><span className="mt-auto inline-flex items-center gap-2 pt-8 text-sm font-semibold text-(--color-text)">{explore} <ChevronRight size={15} /></span></div></Link> }

function StepCard({ number, icon: Icon, title, copy }: { number: string; icon: typeof ScanSearch; title: string; copy: string }) { return <div className="landing-step-card relative rounded-2xl border border-(--color-border) bg-(--color-surface) p-5"><div className="flex items-center justify-between"><span className="font-(family-name:--font-mono) text-[10px] text-(--color-ecom-primary)">{number}</span><span className="flex h-9 w-9 items-center justify-center rounded-full bg-(--color-surface-2) text-(--color-ecom-primary)"><Icon size={17} /></span></div><h3 className="mt-8 text-sm font-semibold">{title}</h3><p className="mt-2 text-sm leading-6 text-(--color-muted)">{copy}</p></div> }

function VoiceDemo({ copy }: { copy: typeof COPY.en }) { return <div className="rounded-[1.75rem] border border-white/15 bg-white/10 p-4 sm:p-6"><div className="flex items-center justify-between border-b border-white/10 pb-4"><div className="flex items-center gap-2"><span className="flex h-8 w-8 items-center justify-center rounded-full bg-(--color-accent-lime) text-(--color-text)"><Bot size={16} /></span><span className="text-sm font-semibold">AI Assistant</span></div><span className="flex items-center gap-2 text-[10px] uppercase tracking-[0.14em] text-white/50"><span className="h-1.5 w-1.5 rounded-full bg-(--color-accent-lime)" /> Live</span></div><div className="space-y-4 py-6"><div className="ml-auto max-w-[85%] rounded-2xl rounded-br-md bg-(--color-accent-lime) px-4 py-3 text-sm leading-6 text-(--color-text)">{copy.transcript}</div><div className="max-w-[90%] rounded-2xl rounded-bl-md bg-white/10 px-4 py-3 text-sm leading-6 text-white/75">{copy.transcriptAnswer}</div></div><div className="flex items-center gap-3 rounded-2xl border border-white/15 bg-white/5 p-2"><div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10"><Mic size={17} className="text-(--color-accent-lime)" /></div><span className="flex-1 px-1 text-xs text-white/45">{copy.askPulse}</span><span className="flex h-8 w-8 items-center justify-center rounded-full bg-(--color-accent-lime) text-(--color-text)"><ArrowUpRight size={15} /></span></div></div> }

function Principle({ icon: Icon, title, copy }: { icon: typeof ShieldCheck; title: string; copy: string }) { return <div className="rounded-2xl border border-(--color-border) bg-(--color-surface) p-5"><Icon size={19} className="text-(--color-ecom-primary)" /><h3 className="mt-7 text-sm font-semibold">{title}</h3><p className="mt-2 text-sm leading-6 text-(--color-muted)">{copy}</p></div> }
