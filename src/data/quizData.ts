/**
 * SYAM PARTY GAME — Master Quiz, Flag, Emoji, Logo & Party Questions Bank
 */

export interface QuizQuestion {
  id: string;
  question: string;
  options: [string, string, string, string];
  answerIndex: number; // 0 = A, 1 = B, 2 = C, 3 = D
  category: string;
}

export const QUIZ_BATTLE_QUESTIONS: QuizQuestion[] = [
  {
    id: 'q1',
    question: 'Planet apa yang dikenal sebagai "Planet Merah" di tata surya kita?',
    options: ['Venus', 'Mars', 'Jupiter', 'Merkurius'],
    answerIndex: 1,
    category: 'Sains',
  },
  {
    id: 'q2',
    question: 'Siapakah presiden pertama Republik Indonesia?',
    options: ['Moh. Hatta', 'Soeharto', 'Ir. Soekarno', 'B.J. Habibie'],
    answerIndex: 2,
    category: 'Sejarah',
  },
  {
    id: 'q3',
    question: 'Hewan mamalia terbesar di bumi saat ini adalah...',
    options: ['Gajah Afrika', 'Paus Biru', 'Hiu Paus', 'Jerapah'],
    answerIndex: 1,
    category: 'Fauna',
  },
  {
    id: 'q4',
    question: 'Ibukota negara Jepang adalah...',
    options: ['Kyoto', 'Osaka', 'Tokyo', 'Hiroshima'],
    answerIndex: 2,
    category: 'Geografi',
  },
  {
    id: 'q5',
    question: 'Apa rumus kimia dari air murni?',
    options: ['CO2', 'NaCl', 'H2O', 'O2'],
    answerIndex: 2,
    category: 'Sains',
  },
  {
    id: 'q6',
    question: 'Candi Borobudur terletak di provinsi...',
    options: ['Jawa Tengah', 'D.I. Yogyakarta', 'Jawa Timur', 'Jawa Barat'],
    answerIndex: 0,
    category: 'Budaya',
  },
  {
    id: 'q7',
    question: 'Berapa jumlah warna pada pelangi standar?',
    options: ['5', '6', '7', '8'],
    answerIndex: 2,
    category: 'Umum',
  },
  {
    id: 'q8',
    question: 'Gunung tertinggi di dunia di atas permukaan laut adalah...',
    options: ['Gunung Kilimanjaro', 'Gunung Everest', 'Gunung Fuji', 'Gunung Semeru'],
    answerIndex: 1,
    category: 'Geografi',
  },
  {
    id: 'q9',
    question: 'Lagu kebangsaan Indonesia Raya diciptakan oleh...',
    options: ['Ismail Marzuki', 'W.R. Supratman', 'Kusbini', 'C. Simanjuntak'],
    answerIndex: 1,
    category: 'Sejarah',
  },
  {
    id: 'q10',
    question: 'Bahasa pemrograman yang sering digunakan untuk interaktivitas web adalah...',
    options: ['HTML', 'CSS', 'JavaScript', 'SQL'],
    answerIndex: 2,
    category: 'Teknologi',
  },
  {
    id: 'q11',
    question: 'Organ tubuh manusia yang berfungsi memompa darah ke seluruh tubuh adalah...',
    options: ['Paru-paru', 'Hati', 'Ginjal', 'Jantung'],
    answerIndex: 3,
    category: 'Biologi',
  },
  {
    id: 'q12',
    question: 'Berapa jumlah benua utama di dunia?',
    options: ['5', '6', '7', '8'],
    answerIndex: 2,
    category: 'Geografi',
  },
  {
    id: 'q13',
    question: 'Mata uang resmi yang digunakan di negara Korea Selatan adalah...',
    options: ['Yen', 'Won', 'Yuan', 'Ringgit'],
    answerIndex: 1,
    category: 'Ekonomi',
  },
  {
    id: 'q14',
    question: 'Siapakah penemu bola lampu pijar praktis?',
    options: ['Nikola Tesla', 'Albert Einstein', 'Thomas Alva Edison', 'Alexander Graham Bell'],
    answerIndex: 2,
    category: 'Tokoh',
  },
  {
    id: 'q15',
    question: 'Dalam permainan catur, pion yang hanya bisa bergerak diagonal adalah...',
    options: ['Benteng (Rook)', 'Gajah (Bishop)', 'Kuda (Knight)', 'Menteri (Queen)'],
    answerIndex: 1,
    category: 'Game',
  },
  {
    id: 'q16',
    question: 'Negara dengan wilayah terluas di dunia adalah...',
    options: ['Kanada', 'Amerika Serikat', 'Rusia', 'Tiongkok'],
    answerIndex: 2,
    category: 'Geografi',
  },
  {
    id: 'q17',
    question: 'Berapa hasil dari 15 x 12?',
    options: ['170', '180', '190', '160'],
    answerIndex: 1,
    category: 'Matematika',
  },
  {
    id: 'q18',
    question: 'Alat musik tradisional "Angklung" berasal dari daerah...',
    options: ['Jawa Barat', 'Sumatera Barat', 'Bali', 'Sulawesi Selatan'],
    answerIndex: 0,
    category: 'Budaya',
  },
  {
    id: 'q19',
    question: 'Gas apakah yang paling banyak terkandung di atmosfer Bumi?',
    options: ['Oksigen', 'Nitrogen', 'Karbon Dioksida', 'Helium'],
    answerIndex: 1,
    category: 'Sains',
  },
  {
    id: 'q20',
    question: 'Siapa nama superhero dengan alter ego Peter Parker?',
    options: ['Batman', 'Iron Man', 'Spider-Man', 'Superman'],
    answerIndex: 2,
    category: 'Pop Culture',
  },
  {
    id: 'q21',
    question: 'Pulau manakah di Indonesia yang dikenal sebagai "Pulau Dewata"?',
    options: ['Lombok', 'Bali', 'Flores', 'Belitung'],
    answerIndex: 1,
    category: 'Pariwisata',
  },
  {
    id: 'q22',
    question: 'Berapa jumlah pemain dalam satu tim sepak bola di lapangan?',
    options: ['9', '10', '11', '12'],
    answerIndex: 2,
    category: 'Olahraga',
  },
  {
    id: 'q23',
    question: 'Simbol unsur emas dalam tabel periodik adalah...',
    options: ['Ag', 'Au', 'Fe', 'Cu'],
    answerIndex: 1,
    category: 'Kimia',
  },
  {
    id: 'q24',
    question: 'Hewan yang bisa hidup di darat dan di air disebut...',
    options: ['Reptil', 'Mamalia', 'Amfibi', 'Aves'],
    answerIndex: 2,
    category: 'Biologi',
  },
  {
    id: 'q25',
    question: 'Tahun berapakah Indonesia memproklamasikan kemerdekaannya?',
    options: ['1942', '1945', '1948', '1950'],
    answerIndex: 1,
    category: 'Sejarah',
  },
  {
    id: 'q26',
    question: 'Karakter game Mario diciptakan oleh perusahaan...',
    options: ['Sony', 'Nintendo', 'Sega', 'Microsoft'],
    answerIndex: 1,
    category: 'Game',
  },
  {
    id: 'q27',
    question: 'Danau vulkanik terbesar di Asia Tenggara dan Indonesia adalah...',
    options: ['Danau Maninjau', 'Danau Singkarak', 'Danau Toba', 'Danau Sentani'],
    answerIndex: 2,
    category: 'Geografi',
  },
  {
    id: 'q28',
    question: 'Satelit alami yang mengitari Bumi adalah...',
    options: ['Titan', 'Bulan', 'Europa', 'Phobos'],
    answerIndex: 1,
    category: 'Astronomi',
  },
  {
    id: 'q29',
    question: 'Makanan khas Sumatera Barat yang pernah dinobatkan terlezat di dunia adalah...',
    options: ['Gudeg', 'Rendang', 'Sate Lilit', 'Rawon'],
    answerIndex: 1,
    category: 'Kuliner',
  },
  {
    id: 'q30',
    question: 'Berapa detik dalam satu jam?',
    options: ['600', '1800', '3600', '7200'],
    answerIndex: 2,
    category: 'Umum',
  },
];

export interface FlagItem {
  id: string;
  country: string;
  flagEmoji: string;
  options: [string, string, string, string];
  answerIndex: number;
}

export const FLAG_QUIZ_DATA: FlagItem[] = [
  { id: 'f1', country: 'Indonesia', flagEmoji: '🇮🇩', options: ['Indonesia', 'Polandia', 'Monako', 'Singapura'], answerIndex: 0 },
  { id: 'f2', country: 'Jepang', flagEmoji: '🇯🇵', options: ['Korea Selatan', 'Tiongkok', 'Jepang', 'Vietnam'], answerIndex: 2 },
  { id: 'f3', country: 'Jerman', flagEmoji: '🇩🇪', options: ['Belgia', 'Jerman', 'Belanda', 'Austria'], answerIndex: 1 },
  { id: 'f4', country: 'Brasil', flagEmoji: '🇧🇷', options: ['Argentina', 'Kolombia', 'Meksiko', 'Brasil'], answerIndex: 3 },
  { id: 'f5', country: 'Prancis', flagEmoji: '🇫🇷', options: ['Italia', 'Prancis', 'Belanda', 'Rusia'], answerIndex: 1 },
  { id: 'f6', country: 'Argentina', flagEmoji: '🇦🇷', options: ['Uruguay', 'Argentina', 'Chili', 'Peru'], answerIndex: 1 },
  { id: 'f7', country: 'Korea Selatan', flagEmoji: '🇰🇷', options: ['Korea Utara', 'Korea Selatan', 'Jepang', 'Thailand'], answerIndex: 1 },
  { id: 'f8', country: 'Mesir', flagEmoji: '🇪🇬', options: ['Arab Saudi', 'Maroko', 'Mesir', 'Turki'], answerIndex: 2 },
  { id: 'f9', country: 'Italia', flagEmoji: '🇮🇹', options: ['Irlandia', 'Hungaria', 'Meksiko', 'Italia'], answerIndex: 3 },
  { id: 'f10', country: 'Australia', flagEmoji: '🇦🇺', options: ['Selandia Baru', 'Inggris', 'Australia', 'Fiji'], answerIndex: 2 },
  { id: 'f11', country: 'Kanada', flagEmoji: '🇨🇦', options: ['Amerika Serikat', 'Kanada', 'Swiss', 'Denmark'], answerIndex: 1 },
  { id: 'f12', country: 'Inggris', flagEmoji: '🇬🇧', options: ['Australia', 'Inggris Raya', 'Islandia', 'Norwegia'], answerIndex: 1 },
  { id: 'f13', country: 'Arab Saudi', flagEmoji: '🇸🇦', options: ['UEA', 'Qatar', 'Arab Saudi', 'Kuwait'], answerIndex: 2 },
  { id: 'f14', country: 'Turki', flagEmoji: '🇹🇷', options: ['Tunisia', 'Turki', 'Pakistan', 'Aljazair'], answerIndex: 1 },
  { id: 'f15', country: 'Spanyol', flagEmoji: '🇪🇸', options: ['Portugal', 'Spanyol', 'Andorra', 'Venezuela'], answerIndex: 1 },
  { id: 'f16', country: 'India', flagEmoji: '🇮🇳', options: ['Irlandia', 'Niger', 'India', 'Bangladesh'], answerIndex: 2 },
  { id: 'f17', country: 'Thailand', flagEmoji: '🇹🇭', options: ['Kamboja', 'Laos', 'Thailand', 'Kosta Rika'], answerIndex: 2 },
  { id: 'f18', country: 'Malaysia', flagEmoji: '🇲🇾', options: ['Singapura', 'Liberia', 'Malaysia', 'Filipina'], answerIndex: 2 },
  { id: 'f19', country: 'Belanda', flagEmoji: '🇳🇱', options: ['Luksemburg', 'Kroasia', 'Belanda', 'Paraguay'], answerIndex: 2 },
  { id: 'f20', country: 'Swiss', flagEmoji: '🇨🇭', options: ['Swiss', 'Georgia', 'Denmark', 'Austria'], answerIndex: 0 },
  { id: 'f21', country: 'Meksiko', flagEmoji: '🇲🇽', options: ['Italia', 'Meksiko', 'Bolivia', 'Ekuador'], answerIndex: 1 },
  { id: 'f22', country: 'Afrika Selatan', flagEmoji: '🇿🇦', options: ['Kenya', 'Ghana', 'Nigeria', 'Afrika Selatan'], answerIndex: 3 },
  { id: 'f23', country: 'Vietnam', flagEmoji: '🇻🇳', options: ['Tiongkok', 'Vietnam', 'Myanmar', 'Somalia'], answerIndex: 1 },
  { id: 'f24', country: 'Portugal', flagEmoji: '🇵🇹', options: ['Spanyol', 'Portugal', 'Brasil', 'Mozambik'], answerIndex: 1 },
  { id: 'f25', country: 'Swedia', flagEmoji: '🇸🇪', options: ['Finlandia', 'Norwegia', 'Swedia', 'Ukraina'], answerIndex: 2 },
];

export interface EmojiQuizItem {
  id: string;
  emojis: string;
  clue: string;
  options: [string, string, string, string];
  answerIndex: number;
}

export const EMOJI_QUIZ_DATA: EmojiQuizItem[] = [
  { id: 'e1', emojis: '🍚 🍗 🔥', clue: 'Makanan Populer', options: ['Nasi Goreng Ayam', 'Ayam Geprek', 'Bubur Ayam', 'Soto Ayam'], answerIndex: 0 },
  { id: 'e2', emojis: '🕷️ 🧑 🕸️', clue: 'Karakter Film', options: ['Ant-Man', 'Spider-Man', 'Batman', 'Venom'], answerIndex: 1 },
  { id: 'e3', emojis: '🦁 👑 🌅', clue: 'Film Animasi', options: ['Tarzan', 'The Lion King', 'Madagascar', 'Kung Fu Panda'], answerIndex: 1 },
  { id: 'e4', emojis: '🚢 ❄️ 💔 🌊', clue: 'Film Romantis Klasik', options: ['Titanic', 'Poseidon', 'Cast Away', 'Avatar'], answerIndex: 0 },
  { id: 'e5', emojis: '☕ 🥛 🧋 🟤', clue: 'Minuman Kekinian', options: ['Kopi Susu Gula Aren', 'Boba Milk Tea', 'Es Cendol', 'Teh Tarik'], answerIndex: 1 },
  { id: 'e6', emojis: '⚽ 👟 🏆 🐐', clue: 'Julukan Pemain Bola', options: ['El Rondo', 'The GOAT', 'Golden Boot', 'Hat-trick'], answerIndex: 1 },
  { id: 'e7', emojis: '🦇 👨 🏙️ 🖤', clue: 'Karakter Superhero', options: ['Dracula', 'Batman', 'Moon Knight', 'Iron Man'], answerIndex: 1 },
  { id: 'e8', emojis: '⚡ 👓 🧙‍♂️ 🏰', clue: 'Film Sihir', options: ['The Lord of the Rings', 'Percy Jackson', 'Harry Potter', 'Doctor Strange'], answerIndex: 2 },
  { id: 'e9', emojis: '🐊 💧 👁️', clue: 'Peribahasa', options: ['Buaya Darat', 'Air Mata Buaya', 'Mulut Harimau', 'Katak dalam Tempurung'], answerIndex: 1 },
  { id: 'e10', emojis: '🚗 💨 🏁 ⚡', clue: 'Genre Film Balapan', options: ['Fast & Furious', 'Need for Speed', 'Cars', 'Gran Turismo'], answerIndex: 0 },
  { id: 'e11', emojis: '🍔 🍟 🥤 🤡', clue: 'Restoran Cepat Saji', options: ['KFC', "McDonald's", 'Burger King', "Wendy's"], answerIndex: 1 },
  { id: 'e12', emojis: '🌋 🏝️ 🐉', clue: 'Taman Nasional Indonesia', options: ['Gunung Leuser', 'Pulau Komodo', 'Bromo Tengger', 'Bunaken'], answerIndex: 1 },
  { id: 'e13', emojis: '🎸 🎤 🎵 🤘', clue: 'Genre Musik', options: ['Jazz', 'Rock & Roll', 'Dangdut', 'Klasik'], answerIndex: 1 },
  { id: 'e14', emojis: '🍄 👨‍🔧 🐢 🏰', clue: 'Game Ikonik', options: ['Sonic', 'Super Mario', 'Zelda', 'Pac-Man'], answerIndex: 1 },
  { id: 'e15', emojis: '🛸 👽 🌌 🪐', clue: 'Kisah Fiksi Ilmiah', options: ['Alien Extraterrestrial', 'Star Wars', 'Interstellar', 'Men in Black'], answerIndex: 1 },
];

export interface LogoQuizItem {
  id: string;
  name: string;
  iconSymbol: string;
  brandColor: string;
  options: [string, string, string, string];
  answerIndex: number;
}

export const LOGO_QUIZ_DATA: LogoQuizItem[] = [
  { id: 'l1', name: 'Spotify', iconSymbol: '🎧 3 Arc Waves', brandColor: '#1DB954', options: ['SoundCloud', 'Spotify', 'Apple Music', 'Deezer'], answerIndex: 1 },
  { id: 'l2', name: 'Netflix', iconSymbol: '🟥 Red "N" Ribbon', brandColor: '#E50914', options: ['HBO', 'Netflix', 'Disney+', 'Prime Video'], answerIndex: 1 },
  { id: 'l3', name: 'Apple', iconSymbol: '🍎 Bitten Apple', brandColor: '#A2AAAD', options: ['Apple', 'Microsoft', 'Xiaomi', 'Dell'], answerIndex: 0 },
  { id: 'l4', name: 'Nike', iconSymbol: '✔️ The Swoosh', brandColor: '#FFFFFF', options: ['Adidas', 'Puma', 'Nike', 'Reebok'], answerIndex: 2 },
  { id: 'l5', name: 'Twitter / X', iconSymbol: '𝕏 Minimalist X', brandColor: '#FFFFFF', options: ['Threads', 'Twitter / X', 'Telegram', 'Discord'], answerIndex: 1 },
  { id: 'l6', name: 'Google', iconSymbol: '🔴🟡🟢🔵 4-Color G', brandColor: '#4285F4', options: ['Google', 'Chrome', 'Bing', 'Android'], answerIndex: 0 },
  { id: 'l7', name: "McDonald's", iconSymbol: '🍟 Golden Arches "M"', brandColor: '#FFC72C', options: ['Burger King', "Wendy's", 'KFC', "McDonald's"], answerIndex: 3 },
  { id: 'l8', name: 'YouTube', iconSymbol: '▶️ Red Play Button', brandColor: '#FF0000', options: ['Vimeo', 'Twitch', 'YouTube', 'TikTok'], answerIndex: 2 },
  { id: 'l9', name: 'Tesla', iconSymbol: '⚡ Stylized "T"', brandColor: '#E82127', options: ['Toyota', 'Tesla', 'Porsche', 'Ferrari'], answerIndex: 1 },
  { id: 'l10', name: 'Discord', iconSymbol: '👾 Game Controller Wumpus', brandColor: '#5865F2', options: ['Slack', 'Discord', 'Skype', 'Teams'], answerIndex: 1 },
];

export const VOTING_PROMPTS = [
  'Siapa yang paling mungkin datang paling terlambat pas janjian?',
  'Siapa yang paling sering menghabiskan uang untuk belanja online tak terduga?',
  'Siapa yang paling jago bikin suasana party jadi seru dan heboh?',
  'Siapa yang paling mungkin jadi miliarder di masa depan?',
  'Siapa yang paling betah scroll media sosial sampai subuh?',
  'Siapa yang paling jago masak makanan enak?',
  'Siapa yang paling mungkin tersesat meski sudah pakai Google Maps?',
  'Siapa yang paling sering kirim stiker/meme kocak di grup chat?',
  'Siapa yang paling jago nge-game sampai lupa waktu?',
  'Siapa yang paling bijak kalau diajak curhat masalah hidup?',
  'Siapa yang paling mungkin menang kompetisi stand-up comedy?',
  'Siapa yang kalau karaoke suaranya paling heboh dan bertenaga?',
];

export const HANGMAN_WORDS = [
  { word: 'KOMPUTER', clue: 'Perangkat elektronik pengolah data' },
  { word: 'INDONESIA', clue: 'Negara kepulauan terbesar di dunia' },
  { word: 'ASTRONOT', clue: 'Penjelajah luar angkasa' },
  { word: 'HARIMAU', clue: 'Kucing besar pemangsa berbelang' },
  { word: 'GITAR', clue: 'Alat musik berdawai yang dipetik' },
  { word: 'PELANGI', clue: 'Fenomena optik warna-warni di langit' },
  { word: 'ALGORITMA', clue: 'Urutan langkah logis penyelesaian masalah' },
  { word: 'SEMARANG', clue: 'Ibukota Provinsi Jawa Tengah' },
  { word: 'MARTABAK', clue: 'Kuliner malam manis atau telur yang lezat' },
  { word: 'BOROBUDUR', clue: 'Candi Buddha terbesar di dunia' },
  { word: 'ROBOTIKA', clue: 'Cabang teknologi otomasi dan kecerdasan mesin' },
  { word: 'KANGGURU', clue: 'Hewan berkantung khas Australia' },
];

export const SOUND_QUIZ_DATA = [
  {
    id: 's1',
    soundType: 'ambulance',
    soundName: 'Sirene Ambulans / Polisi',
    options: ['Sirene Ambulans', 'Klakson Kereta Api', 'Alarm Kebakaran', 'Sirine Kapal'],
    answerIndex: 0,
    category: 'Kendaraan',
  },
  {
    id: 's2',
    soundType: 'laser',
    soundName: 'Tembakan Laser Sci-Fi',
    options: ['Petir Menyambar', 'Tembakan Laser', 'Kembang Api', 'Pecahan Kaca'],
    answerIndex: 1,
    category: 'Retro Sci-Fi',
  },
  {
    id: 's3',
    soundType: 'bird',
    soundName: 'Kicauan Burung Pagi',
    options: ['Suara Jangkrik', 'Kicauan Burung', 'Tetesan Air', 'Denting Piano'],
    answerIndex: 1,
    category: 'Alam',
  },
  {
    id: 's4',
    soundType: 'heartbeat',
    soundName: 'Detak Jantung Manusia',
    options: ['Langkah Kaki', 'Detak Jantung', 'Suara Drum Bass', 'Pukulan Palu'],
    answerIndex: 1,
    category: 'Biologi',
  },
  {
    id: 's5',
    soundType: 'bell',
    soundName: 'Lonceng Menara / Kuil',
    options: ['Lonceng Menara', 'Gong Tradisional', 'Segitiga Musik', 'Denting Gelas'],
    answerIndex: 0,
    category: 'Benda',
  },
];
