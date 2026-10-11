// Temasider: /tema/<slug>. Each topic collects posts by date range and/or words.
const between = (a, b) => (p) => p.iso.slice(0, 10) >= a && p.iso.slice(0, 10) <= b;
const words = (re) => (p) => re.test(p.title + ' ' + p.text);

const TOPICS = [
  {
    slug: 'sharm-el-sheikh-egypt',
    name: 'Sharm El Sheikh og Egypt',
    title: 'Sharm El Sheikh og Egypt – reiseblogg fra to turer (2008 og 2012)',
    intro: [
      'Vi har vært i Sharm El Sheikh to ganger. Høsten 2008 dro Finn Magne og Tina på dykkeferie i november: dykkekurs og dykk på Jackson Reef og Ras Um Sid, dager i Naama Bay og en tur til Kairo, pyramidene og Sfinksen. Det var også turen der Tina ble kurert for flyskrekken.',
      'Høsten 2012 reiste vi tilbake med alle seks barna. Da ble det Old Market, glassbunnbåt, firhjuling, snorkling på El Fanar, egyptisk aften med Hamdy og bursdagsfeiring for Finn Magne. Her er alle innleggene fra begge turene, fra pakking og nedtelling til hjemreise.'
    ],
    match: (p) => between('2008-11-11', '2008-12-03')(p) || between('2012-10-09', '2012-11-13')(p) || p.slug.startsWith('2014-04-10-mitt-beste-reiseminne')
  },
  {
    slug: 'bryllup-og-bryllupsreise',
    name: 'Bryllup og bryllupsreise 2010',
    title: 'Bryllup og bryllupsreise 2010 – Spania, Madrid, Amsterdam og Sardinia',
    intro: [
      'Sommeren 2010 giftet vi oss i Sandefjord kirke. Før det ble det bryllupsplanlegging og danseøving til wienervalsen.',
      'Bryllupsreisen gikk først til Spania (Alicante), så videre til Madrid og Amsterdam, og til slutt til Alghero på Sardinia. Der la vi også ut små videosnutter underveis. Her er hele historien dag for dag.'
    ],
    match: between('2010-07-05', '2010-09-21')
  },
  {
    slug: 'paris-og-london-med-barn',
    name: 'Paris og London med barn',
    title: 'Paris og London med barn – Disneyland Paris og Harry Potter Studio Tour',
    intro: [
      'I januar og februar 2013 tok vi to byturer med barna. I Paris gikk vi gatelangs i sentrum og brukte en hel dag i Disneyland Paris.',
      'I London ble det Harry Potter Studio Tour, Tower of London, Chinatown og litt shopping før hjemreisen. Her er innleggene fra begge turene.'
    ],
    match: between('2013-01-13', '2013-02-09')
  },
  {
    slug: 'tyrkia-belek-alanya-side',
    name: 'Tyrkia 2013',
    title: 'Tyrkia 2013 – Belek, Antalya, Alanya og Side',
    intro: [
      'I mars 2013 dro foreldrene og tvillingene på tur til Tyrkia. Vi bodde i Belek, tok buss til Antalya og leide bil videre til Alanya og gamlebyen i Side.',
      'Her er innleggene dag for dag, fra en forsovet frokost til den lange veien hjem.'
    ],
    match: between('2013-03-02', '2013-03-22')
  },
  {
    slug: 'husbygging-og-oppussing',
    name: 'Husbygging og oppussing',
    title: 'Husbygging og oppussing 2009–2010 – fra riving til ferdig hjem',
    intro: [
      'Fra høsten 2009 til sommeren 2010 bygde vi om og på huset vårt på Storøya. Vi blogget hele prosessen: riving, byggetegninger, venting, nytt bad, flislegging, nytt tak midt på vinteren og maling.',
      'Til slutt kom før og etter-bildene. Innleggene viser hvordan et byggeprosjekt faktisk går, med forsinkelser og alt.'
    ],
    match: (p) => between('2009-08-21', '2010-07-29')(p) && p.cls === 'blog' && !/bryllup|gifter|wienervals|konfirmasjon|puppy|påske|sommeren nærmer seg/i.test(p.title + ' ' + p.text.slice(0, 200))
  },
  {
    slug: 'korps',
    name: 'Korps',
    title: 'Korps – korpsmamma, Peter Wessel Festivalen og korpsfestivaler i Danmark',
    intro: [
      'Korps er en stor del av hverdagen vår. Her finner du innlegget «En korpsmammas bekjennelser», som ble omtalt i Østlandsposten, og bilder fra Peter Wessel Festivalen.',
      'Du finner også to uker med korpsfestivaler i Danmark og oppropet om å stemme på Tjodalyng Skolekorps.'
    ],
    match: (p) => /korps|peter wessel|pw avspark|to uker festival|jeg er overveldet|hjelpe flotte barn/i.test(p.title)
  },
  {
    slug: 'justin-bieber',
    name: 'Justin Bieber i Oslo 2013',
    title: 'Justin Bieber i Oslo 2013 – Bieber-mania og konserten i Telenor Arena',
    intro: [
      'I april 2013 kom Justin Bieber til Norge, og vi var der. Her er innleggene fra hysteriet før konserten, selve kvelden i Telenor Arena og ettertanken etterpå.'
    ],
    match: (p) => /bieber|jb konsert|telenor arena|klar for kaos|forskjell på anmeldelser/i.test(p.title)
  }
];

module.exports = { TOPICS };
