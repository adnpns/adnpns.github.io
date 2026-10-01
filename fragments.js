/*
  fragments.js — contenu pur, aucune logique.

  Chaque fragment est un objet posé dans la constellation. Pour ajouter
  un nouvel objet au site, il suffit d'ajouter une entrée ici : rien
  d'autre à toucher dans le reste du code (main.js lit cette liste
  automatiquement pour construire la constellation et les pages).

  Champs :
    key      identifiant unique, utilisé dans l'URL (fragment.html?key=...)
    num      numéro affiché (chaîne, garde le zéro initial : '01')
    title    titre affiché sous l'objet et en haut de sa page
    shape    'square' | 'tall' | 'wide' | 'long' — proportion réelle de l'objet
    image    chemin vers la photo, relatif à la racine du site
    text     texte court : objet concret -> détail intime -> idée qui émerge
    words    mots qui se dégagent du texte ("résonances"), 3 à 5 maximum,
             jamais présentés comme des catégories dans l'interface
*/

const FRAGMENTS = [
  {
    key: 'seiko',
    num: '01',
    title: 'Seiko',
    shape: 'square',
    image: 'images/seiko.jpg',
    text: "Trouvée sur Vinted, une forme qui ne ressemblait à aucune autre montre. Une offre, et elle part avant. Quelqu'un retrouve la même ailleurs, aurait pu la revendre plus cher, et indique simplement où elle est. Elle est là depuis, pile morte comprise. Ça changera un jour.",
    words: ['regard', 'valeur', 'seconde main', 'rencontres']
  },
  {
    key: 'vestjoy',
    num: '02',
    title: 'Vestjoy on Everyday Life',
    shape: 'tall',
    image: 'images/vestjoy.jpg',
    text: "La tranche a jauni plus vite que le reste de la bibliothèque, à force de rester sur le rebord de la fenêtre. Offert un soir de premier rendez-vous, avant que ça devienne sérieux, puis fini. Une page cornée au chapitre sur les chaussures, celui qui n'a jamais été lu jusqu'au bout. Le reste, si.",
    words: ['mémoire', 'sensibilité', 'regard', 'beauté', 'trace']
  },
  {
    key: 'psg',
    num: '03',
    title: 'PSG',
    shape: 'wide',
    image: 'images/psg.jpg',
    text: "Pas un maillot acheté hier dans une boutique officielle. Un vieux merchandising introuvable aujourd'hui, floqué au nom d'un joueur oublié. Acheté trop grand exprès, pour durer deux étés. Il a fini par aller, puis ne plus aller, puis rester quand même dans un tiroir qui a changé quatre fois d'appartement.",
    words: ['Paris', 'sport', 'uniforme', 'mémoire']
  },
  {
    key: 'excalibur',
    num: '04',
    title: 'Varsity Jacket Excalibur',
    shape: 'wide',
    image: 'images/excalibur.jpg',
    text: "Trouvée en cherchant autre chose, pendant un voyage à Las Vegas en 2017, dans une friperie près du casino qui a donné son nom à la veste. Elle allait du premier coup, ce qui n'arrive presque jamais. La doublure rouge est encore intacte. L'endroit n'a jamais été revu ; la veste, si, tous les hivers.",
    words: ['recherche', 'hasard', 'vestiaire', 'trouvaille']
  },
  {
    key: 'crocs',
    num: '05',
    title: "Crocs x Levi's",
    shape: 'wide',
    image: 'images/crocs.jpg',
    text: "Achetées un peu par jeu, sans vraiment y croire : un motif indigo qui rappelle un vieux jean délavé, posé sur du caoutchouc increvable. Portées l'été, sur le carrelage froid de la cuisine, jamais dehors. Personne ne les trouve élégantes. À force, si.",
    words: ['jeu', 'confort', 'détournement', 'été', 'style']
  },
  {
    key: 'loafers',
    num: '06',
    title: 'Penny Loafers',
    shape: 'long',
    image: 'images/loafers.jpg',
    text: "Achetés pour un mariage, devenus presque des chaussons à force d'être portés pour tout sauf ça. L'association préférée : un short de sport et ces mêmes loafers, l'élégance et le quotidien qui se regardent sans se juger.",
    words: ['tenue', 'confort', 'contraste', 'quotidien']
  },
  {
    key: 'porteclefs',
    num: '07',
    title: 'Porte-clés Paris',
    shape: 'tall',
    image: 'images/porteclefs.jpg',
    text: "Un porte-clés en métal, trouvé dans un tiroir qui n'était pas censé être le bon, avec les monuments de la ville gravés en couleurs criardes. Le genre d'objet qu'on achète pour quelqu'un d'autre, jamais pour soi. Il ouvre une porte qui n'existe plus.",
    words: ['Paris', 'détail', 'secret', 'souvenir']
  },
  {
    key: 'charm',
    num: '08',
    title: 'Charm de verre, Groix',
    shape: 'square',
    image: 'images/charm.jpg',
    text: "Un petit disque de verre fondu, rapporté d'une île où le retour se fait moins souvent que souhaité. Fait à la main par quelqu'un dont seul le prénom est connu. Il ne vaut presque rien, et rien au monde ne le remplacerait.",
    words: ['lieu', 'artisanat', 'souvenir', 'matière']
  },
  {
    key: 'bo',
    num: '09',
    title: 'Bo',
    shape: 'square',
    image: 'images/bo.jpg',
    text: "Un chien croisé presque tous les jours. Il porte un bandana orange sans jamais s'en plaindre. Il ne sait rien des métiers des humains qu'il croise, et c'est peut-être pour ça qu'il inspire confiance.",
    words: ['connexion', 'confiance', 'empathie', 'vivant']
  },
  {
    key: 'fruits',
    num: '10',
    title: 'Fruits artificiels',
    shape: 'wide',
    image: 'images/fruits.jpg',
    text: "Un panier de faux fruits en plastique, trouvé dans une boutique qui fermait, acheté pour rien, gardé pour la couleur. Ils ne pourrissent jamais, ne se mangent jamais, ne servent à rien d'autre qu'à être regardés.",
    words: ['couleur', 'jeu', 'boutique', 'créativité']
  },
  {
    key: 'arc_en_ciel',
    num: '11',
    title: "Pull arc-en-ciel",
    shape: 'tall',
    image: 'images/espace/arc-en-ciel.jpg',
    text: "Toutes les couleurs d'un coup, en grosse maille, sur un fond crème qui ne fait que les laisser parler. Le genre de pièce qui décide de la tenue à elle seule : un jean, et c'est fini.",
    words: ["couleur", "jeu", "shooting", "matière"]
  },
  {
    key: 'mains',
    num: '12',
    title: "Mains, bagues",
    shape: 'tall',
    image: 'images/espace/mains.jpg',
    text: "Des bagues empilées, un médaillon, des ongles vernis. Sur un shooting, les détails finissent souvent par voler la vedette au vêtement.",
    words: ["détail", "bijoux", "shooting", "style"]
  },
  {
    key: 'varsity_vert',
    num: '13',
    title: "Varsity verte",
    shape: 'tall',
    image: 'images/espace/varsity-vert.jpg',
    text: "Une varsity verte au col cravaté, un regard droit vers l'objectif. Le vestiaire universitaire américain, détourné en portrait parisien.",
    words: ["uniforme", "sport", "shooting", "détournement"]
  },
  {
    key: 'albiceleste',
    num: '14',
    title: "Albiceleste",
    shape: 'tall',
    image: 'images/espace/albiceleste.jpg',
    text: "Un maillot de foot argentin porté avec un pantalon de cuir, une chaise de bureau, des baskets turquoise. Le sport sorti du stade, sans jamais renier d'où il vient.",
    words: ["sport", "uniforme", "shooting", "contraste"]
  },
  {
    key: 'lunettes_blanches',
    num: '15',
    title: "Lunettes blanches",
    shape: 'tall',
    image: 'images/espace/lunettes-blanches.jpg',
    text: "Des lunettes enveloppantes, blanches, un peu trop grandes. Un accessoire qui suffit à déplacer toute une silhouette d'une décennie.",
    words: ["détail", "accessoire", "shooting", "style"]
  },
  {
    key: 'echarpe_portee',
    num: '16',
    title: "L'écharpe",
    shape: 'tall',
    image: 'images/espace/echarpe-portee.jpg',
    text: "Une écharpe de supporter tenue à bout de bras, comme une banderole. Deux personnes, deux pulls jaunes, une même équipe.",
    words: ["Paris", "sport", "shooting", "souvenir"]
  },
  {
    key: 'pull_jaune',
    num: '17',
    title: "Pull jaune",
    shape: 'tall',
    image: 'images/espace/pull-jaune.jpg',
    text: "Un pull jaune côtelé sur un col de chemise blanche, devant un fond bleu profond. Le contraste fait tout le travail.",
    words: ["couleur", "contraste", "shooting", "vestiaire"]
  },
  {
    key: 'fond_olive',
    num: '18',
    title: "Fond olive",
    shape: 'tall',
    image: 'images/espace/fond-olive.jpg',
    text: "Pull marine, chemise blanche, cravate bordeaux, sur un fond olive. Un uniforme d'écolier rejoué sans nostalgie.",
    words: ["uniforme", "couleur", "shooting", "tenue"]
  },
  {
    key: 'cuir_rouge',
    num: '19',
    title: "Cuir rouge",
    shape: 'tall',
    image: 'images/espace/cuir-rouge.jpg',
    text: "Un blouson de cuir rouge sur un t-shirt imprimé. Une pièce qui a déjà beaucoup vécu, et qui le montre.",
    words: ["matière", "trace", "shooting", "vestiaire"]
  },
  {
    key: 'chemise_blanche',
    num: '20',
    title: "Chemise blanche",
    shape: 'wide',
    image: 'images/espace/chemise-blanche.jpg',
    text: "Une chemise blanche trop grande, en noir et blanc. Rien d'autre. Parfois la pièce la plus simple dit le plus.",
    words: ["regard", "sobriété", "shooting", "matière"]
  },
  {
    key: 'rose',
    num: '21',
    title: "Rose",
    shape: 'tall',
    image: 'images/espace/rose.jpg',
    text: "Une maille rose vif sur un jean clair. Une couleur qu'on n'ose pas toujours, portée comme une évidence.",
    words: ["couleur", "audace", "shooting", "style"]
  },
  {
    key: 'col_en_v',
    num: '22',
    title: "Col en V",
    shape: 'tall',
    image: 'images/espace/col-en-v.jpg',
    text: "Un haut de survêtement marine à large V bleu ciel, des mocassins turquoise. Le sport des années 80, assis sur une chaise de salon.",
    words: ["sport", "couleur", "shooting", "détournement"]
  },
  {
    key: 'casquette',
    num: '23',
    title: "Casquette",
    shape: 'tall',
    image: 'images/espace/casquette.jpg',
    text: "Une casquette à visière plate, orange et blanche, logo d'équipe brodé. Le merchandising sportif devenu objet de collection.",
    words: ["sport", "détail", "trouvaille", "accessoire"]
  },
  {
    key: 'echarpe',
    num: '24',
    title: "Écharpe de supporter",
    shape: 'tall',
    image: 'images/espace/echarpe.jpg',
    text: "Rouge, blanc, noir, frangée aux deux bouts. Un objet de tribune, chargé de dimanches et de chants.",
    words: ["Paris", "sport", "souvenir", "matière"]
  },
  {
    key: 'bob',
    num: '25',
    title: "Bob en laine",
    shape: 'tall',
    image: 'images/espace/bob.jpg',
    text: "Un bob tricoté, motifs ethniques, laine épaisse. Une pièce de voyage qui a trouvé sa place dans un vestiaire de ville.",
    words: ["matière", "artisanat", "trouvaille", "voyage"]
  },
  {
    key: 'cesca',
    num: '26',
    title: "Chaise cannée",
    shape: 'tall',
    image: 'images/espace/cesca.jpg',
    text: "Cannage, tube chromé, bois courbé : une chaise de designer chinée, devenue accessoire de shooting.",
    words: ["objet", "design", "trouvaille", "shooting"]
  },
  {
    key: 'tabouret',
    num: '27',
    title: "Tabouret de piano",
    shape: 'tall',
    image: 'images/espace/tabouret.jpg',
    text: "Bois tourné, assise capitonnée, vis de réglage. Un tabouret de piano ancien, sur lequel les modèles du shooting se sont assis tour à tour.",
    words: ["objet", "shooting", "trace", "artisanat"]
  },
  {
    key: 'varsity',
    num: '28',
    title: "Varsity",
    shape: 'tall',
    image: 'images/espace/varsity.jpg',
    text: "Corps vert, manches crème, lettre brodée. La varsity, uniforme de campus devenu classique de friperie.",
    words: ["uniforme", "sport", "vestiaire", "trouvaille"]
  },
  {
    key: 'satin_bleu',
    num: '29',
    title: "Satin bleu",
    shape: 'tall',
    image: 'images/espace/satin-bleu.jpg',
    text: "Un blouson de satin bleu électrique, liserés jaunes, écusson étoilé. La brillance d'une veste d'équipe des années 80.",
    words: ["sport", "couleur", "matière", "trouvaille"]
  },
  {
    key: 'rugby_jaune',
    num: '30',
    title: "Rugby jaune",
    shape: 'wide',
    image: 'images/espace/rugby-jaune.jpg',
    text: "Un maillot de rugby jaune soleil au col blanc. Épais, solide, fait pour durer plus qu'une saison.",
    words: ["sport", "couleur", "vestiaire", "matière"]
  },
  {
    key: 'gj_rugby',
    num: '31',
    title: "GJ Rugby",
    shape: 'wide',
    image: 'images/espace/gj-rugby.jpg',
    text: "Satin noir, bords côtelés rouge et jaune, « GJ Rugby » brodé dans le dos. Une veste de club amateur, quelque part, un jour.",
    words: ["sport", "souvenir", "trouvaille", "uniforme"]
  }
];

/*
  Positions de départ dans l'espace (pourcentages de l'écran), volontairement
  dispersées et jamais en grille. Séparées du contenu ci-dessus : la
  disposition visuelle est un souci de design, pas de contenu, donc elle
  vit ici mais reste distincte de la liste FRAGMENTS. Ajouter un fragment
  à FRAGMENTS sans lui donner de position ici le fait apparaître avec une
  position générée automatiquement par main.js (voir generateLayout).
*/
const FRAGMENT_LAYOUT = {
  seiko:      { x: 14, y: 22, width: 150, rot: -2 },
  vestjoy:    { x: 32, y: 58, width: 115, rot: 2 },
  psg:        { x: 52, y: 18, width: 190, rot: -1 },
  excalibur:  { x: 20, y: 74, width: 170, rot: 1.5 },
  crocs:      { x: 68, y: 52, width: 165, rot: -1.5 },
  loafers:    { x: 78, y: 26, width: 185, rot: 1 },
  porteclefs: { x: 44, y: 40, width: 100, rot: -2.5 },
  charm:      { x: 60, y: 78, width: 130, rot: 2 },
  bo:         { x: 86, y: 68, width: 150, rot: -1 },
  fruits:     { x: 10, y: 48, width: 155, rot: 1.5 },
  arc_en_ciel      : { x: 80, y: 132, width: 125, rot: 2.5 },
  casquette        : { x: 51, y: 128, width: 125, rot: -1.5 },
  mains            : { x: 23, y: 130, width: 135, rot: -1.5 },
  bob              : { x: 53, y: 157, width: 115, rot: -2.5 },
  varsity_vert     : { x: 80, y: 169, width: 135, rot: -1.5 },
  cesca            : { x: 8, y: 158, width: 135, rot: -2.5 },
  albiceleste      : { x: 23, y: 175, width: 115, rot: -1.5 },
  echarpe          : { x: 76, y: 164, width: 125, rot: -2.5 },
  lunettes_blanches: { x: 59, y: 195, width: 115, rot: 2.0 },
  tabouret         : { x: 39, y: 194, width: 115, rot: -1.5 },
  echarpe_portee   : { x: 20, y: 215, width: 135, rot: -1.0 },
  varsity          : { x: 80, y: 222, width: 135, rot: -2.0 },
  pull_jaune       : { x: 43, y: 231, width: 125, rot: 2.5 },
  satin_bleu       : { x: 74, y: 228, width: 125, rot: 2.5 },
  fond_olive       : { x: 13, y: 250, width: 125, rot: -1.5 },
  rugby_jaune      : { x: 76, y: 258, width: 165, rot: -1.0 },
  cuir_rouge       : { x: 26, y: 258, width: 115, rot: -1.5 },
  gj_rugby         : { x: 54, y: 260, width: 180, rot: 1.5 },
  chemise_blanche  : { x: 72, y: 283, width: 180, rot: 1.5 },
  rose             : { x: 80, y: 264, width: 115, rot: -1.5 },
  col_en_v         : { x: 32, y: 299, width: 125, rot: -2.5 }
};
