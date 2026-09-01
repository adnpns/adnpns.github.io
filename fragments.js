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
    text: "Trouvée sur Vinted, une forme qui ne ressemblait à aucune autre montre. J'ai fait une offre, elle est partie avant. Quelqu'un a retrouvé la même ailleurs, aurait pu me la revendre plus cher, m'a simplement dit où elle était. Elle est là depuis, avec sa pile morte. Je changerai ça un jour.",
    words: ['regard', 'valeur', 'seconde main', 'rencontres']
  },
  {
    key: 'vestjoy',
    num: '02',
    title: 'Vestjoy on Everyday Life',
    shape: 'tall',
    image: 'images/vestjoy.jpg',
    text: "La tranche a jauni plus vite que le reste de ma bibliothèque, à force d'être posé sur le rebord de la fenêtre. Offert un soir de premier rendez-vous, avant que ça devienne sérieux, puis fini. Il y a une page cornée au chapitre sur les chaussures, celui qu'on n'a jamais réellement lu jusqu'au bout. Le reste, si.",
    words: ['mémoire', 'sensibilité', 'regard', 'beauté', 'trace']
  },
  {
    key: 'psg',
    num: '03',
    title: 'PSG',
    shape: 'wide',
    image: 'images/psg.jpg',
    text: "Pas un maillot acheté hier dans une boutique officielle. Un vieux merchandising qu'on ne retrouve plus, floqué au nom d'un joueur que j'ai oublié. Ma mère l'avait acheté trop grand exprès, pour qu'il dure deux étés. Il a fini par m'aller, puis ne plus m'aller, puis rester quand même dans un tiroir qui a changé quatre fois d'appartement.",
    words: ['Paris', 'sport', 'uniforme', 'mémoire']
  },
  {
    key: 'excalibur',
    num: '04',
    title: 'Varsity Jacket Excalibur',
    shape: 'wide',
    image: 'images/excalibur.jpg',
    text: "Trouvée en cherchant autre chose, pendant un voyage à Las Vegas en 2017, dans une friperie près du casino qui a donné son nom à la veste. Elle m'allait du premier coup, ce qui n'arrive presque jamais. La doublure rouge est encore intacte. Je n'ai jamais remis les pieds à cet endroit, mais la veste, si, tous les hivers.",
    words: ['recherche', 'hasard', 'vestiaire', 'trouvaille']
  },
  {
    key: 'crocs',
    num: '05',
    title: "Crocs x Levi's",
    shape: 'wide',
    image: 'images/crocs.jpg',
    text: "Achetées un peu par jeu, sans vraiment y croire, un motif indigo qui rappelle un vieux jean délavé posé sur du caoutchouc increvable. Je les mets l'été, sur le carrelage froid de la cuisine, jamais dehors. Personne ne les trouve élégantes. Moi si, à force.",
    words: ['jeu', 'confort', 'détournement', 'été', 'style']
  },
  {
    key: 'loafers',
    num: '06',
    title: 'Penny Loafers',
    shape: 'long',
    image: 'images/loafers.jpg',
    text: "Achetés pour un mariage, devenus presque des chaussons à force d'être portés pour tout sauf ça. Mon association préférée : un short de sport et ces mêmes loafers, l'élégance et le quotidien qui se regardent sans se juger.",
    words: ['tenue', 'confort', 'contraste', 'quotidien']
  },
  {
    key: 'porteclefs',
    num: '07',
    title: 'Porte-clés Paris',
    shape: 'tall',
    image: 'images/porteclefs.jpg',
    text: "Un porte-clés en métal, trouvé dans un tiroir qui n'était pas censé être le mien, avec les monuments de la ville gravés en couleurs criardes. Le genre d'objet qu'on achète pour quelqu'un d'autre, jamais pour soi. Il ouvre une porte qui n'existe plus.",
    words: ['Paris', 'détail', 'secret', 'souvenir']
  },
  {
    key: 'charm',
    num: '08',
    title: 'Charm de verre, Groix',
    shape: 'square',
    image: 'images/charm.jpg',
    text: "Un petit disque de verre fondu, rapporté d'une île où je ne retourne pas si souvent que je le voudrais. Fait à la main par quelqu'un dont je ne connais que le prénom. Il ne vaut presque rien et je ne m'en séparerais pour rien au monde.",
    words: ['lieu', 'artisanat', 'souvenir', 'matière']
  },
  {
    key: 'bo',
    num: '09',
    title: 'Bo',
    shape: 'square',
    image: 'images/bo.jpg',
    text: "Un chien qui n'est pas le mien mais que je regarde presque tous les jours. Il porte un bandana orange sans jamais s'en plaindre. Il ne sait pas ce que je fais dans la vie, et c'est peut-être pour ça que je lui fais confiance.",
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
  fruits:     { x: 10, y: 48, width: 155, rot: 1.5 }
};
