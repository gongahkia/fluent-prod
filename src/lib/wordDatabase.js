import translationService from '../services/translationService';

// Shared Japanese-English word database for the entire application
// This eliminates duplication between NewsFeed and EnhancedCommentSystem
// Now enhanced with real-time translation API

export const japaneseWords = {
  // Basic Japanese words
  '地': { japanese: '地', hiragana: 'ち', english: 'ground/earth', level: 2, example: '地元の人だけが知る', exampleEn: 'Only locals know' },
  'じ': { japanese: 'じ', hiragana: 'じ', english: 'ji (hiragana character)', level: 1, example: '先月、これらの場所の一つを訪問しました！それを経営していたおじいさんは、私の下手な日本語にとても親切で忍耐強くしてくれました。', exampleEn: 'I visited one of these places last month! The grandpa who ran it was so kind and patient with my broken Japanese.' },
  'ま': { japanese: 'ま', hiragana: 'ま', english: 'ma (hiragana character)', level: 1, example: '先月、これらの場所の一つを訪問しました！', exampleEn: 'I visited one of these places last month!' },
  'は': { japanese: 'は', hiragana: 'は', english: 'wa (topic particle)', level: 1, example: 'この場所は本当に本格的です！', exampleEn: 'This place is really authentic!' },
  'の': { japanese: 'の', hiragana: 'の', english: 'no (possessive particle)', level: 1, example: '地元の人だけが知る隠れた宝石ですね。', exampleEn: 'It\'s a hidden gem that only locals know about.' },
  'す': { japanese: 'す', hiragana: 'す', english: 'su (hiragana character, part of です)', level: 1, example: 'この場所は本当に本格的です！', exampleEn: 'This place is really authentic!' },
  '元': { japanese: '元', hiragana: 'もと', english: 'origin/source', level: 3, example: '地元の人だけが知る', exampleEn: 'Only locals know' },
  '人': { japanese: '人', hiragana: 'ひと', english: 'person/people', level: 1, example: '地元の人だけが知る', exampleEn: 'Only locals know' },
  '知': { japanese: '知', hiragana: 'し', english: 'know/knowledge', level: 2, example: '地元の人だけが知る', exampleEn: 'Only locals know' },
  '店': { japanese: '店', hiragana: 'みせ', english: 'shop/store', level: 2, example: 'ラーメン店', exampleEn: 'ramen shop' },
  '東': { japanese: '東', hiragana: 'ひがし', english: 'east', level: 2, example: '東京', exampleEn: 'Tokyo (Eastern capital)' },
  '京': { japanese: '京', hiragana: 'きょう', english: 'capital', level: 3, example: '東京', exampleEn: 'Tokyo (Eastern capital)' },
  '最': { japanese: '最', hiragana: 'さい', english: 'most/extreme', level: 4, example: '最も busy', exampleEn: 'most busy' },
  '区': { japanese: '区', hiragana: 'く', english: 'ward/district', level: 3, example: 'な地区で', exampleEn: 'in the district' },
  '下': { japanese: '下', hiragana: 'した', english: 'under/below', level: 2, example: '地下の food', exampleEn: 'underground food' },
  '何': { japanese: '何', hiragana: 'なに', english: 'what/how many', level: 1, example: '何世代にも', exampleEn: 'for many generations' },
  '世': { japanese: '世', hiragana: 'せ', english: 'world/generation', level: 4, example: '何世代にも', exampleEn: 'for many generations' },
  '代': { japanese: '代', hiragana: 'だい', english: 'generation/era', level: 3, example: '何世代にも', exampleEn: 'for many generations' },
  '提': { japanese: '提', hiragana: 'てい', english: 'offer/present', level: 5, example: '提供してきました', exampleEn: 'have been providing' },
  '供': { japanese: '供', hiragana: 'きょう', english: 'offer/supply', level: 4, example: '提供してきました', exampleEn: 'have been providing' },
  '若': { japanese: '若', hiragana: 'わか', english: 'young', level: 3, example: '若者', exampleEn: 'young people' },
  '者': { japanese: '者', hiragana: 'しゃ', english: 'person/people', level: 3, example: '若者', exampleEn: 'young people' },
  '変': { japanese: '変', hiragana: 'へん', english: 'change/strange', level: 3, example: '変化させています', exampleEn: 'are changing' },
  '化': { japanese: '化', hiragana: 'か', english: 'change/transform', level: 4, example: '変化させています', exampleEn: 'are changing' },
  '文': { japanese: '文', hiragana: 'ぶん', english: 'writing/culture', level: 2, example: '文化', exampleEn: 'culture' },
  '見': { japanese: '見', hiragana: 'み', english: 'see/look', level: 1, example: '見られます', exampleEn: 'can be seen' },

  // Compound Japanese words
  '地元': { japanese: '地元', hiragana: 'じもと', english: 'local', level: 3, example: '地元の人だけが知る', exampleEn: 'Only locals know' },
  '地元の人だけが知る': { japanese: '地元の人だけが知る', hiragana: 'じもとのひとだけがしる', english: 'only locals know', level: 6, example: '地元の人だけが知る hidden ラーメン店', exampleEn: 'Hidden ramen shops that only locals know' },
  'ラーメン': { japanese: 'ラーメン', hiragana: 'らーめん', english: 'ramen', level: 2, example: 'authentic ラーメンを提供', exampleEn: 'providing authentic ramen' },
  '東京': { japanese: '東京', hiragana: 'とうきょう', english: 'Tokyo', level: 1, example: '東京の最も busy な地区', exampleEn: 'Tokyo\'s busiest districts' },
  '最も': { japanese: '最も', hiragana: 'もっとも', english: 'most', level: 4, example: '東京の最も busy な地区', exampleEn: 'Tokyo\'s busiest districts' },
  '地区': { japanese: '地区', hiragana: 'ちく', english: 'district/area', level: 4, example: '東京の最も busy な地区で地下の food culture を探索。', exampleEn: 'Exploring underground food culture in Tokyo\'s busiest districts.' },
  '地下': { japanese: '地下', hiragana: 'ちか', english: 'underground/basement', level: 3, example: '東京の最も busy な地区で地下の food culture を探索。', exampleEn: 'Exploring underground food culture in Tokyo\'s busiest districts.' },
  '探索': { japanese: '探索', hiragana: 'たんさく', english: 'exploration/investigation', level: 6, example: '東京の最も busy な地区で地下の food culture を探索。', exampleEn: 'Exploring underground food culture in Tokyo\'s busiest districts.' },
  'これらの': { japanese: 'これらの', hiragana: 'これらの', english: 'these', level: 3, example: 'これらの family-run business の店', exampleEn: 'These family-run business shops' },
  '何世代にもわたって': { japanese: '何世代にもわたって', hiragana: 'なんせだいにもわたって', english: 'for many generations', level: 6, example: '何世代にもわたって authentic ラーメンを提供してきました', exampleEn: 'Have been providing authentic ramen for many generations' },
  '提供してきました': { japanese: '提供してきました', hiragana: 'ていきょうしてきました', english: 'have been providing', level: 6, example: '何世代にもわたって authentic ラーメンを提供してきました', exampleEn: 'Have been providing authentic ramen for many generations' },
  '若者': { japanese: '若者', hiragana: 'わかもの', english: 'young people', level: 4, example: '若者の creativity', exampleEn: 'young people\'s creativity' },
  '変化させています': { japanese: '変化させています', hiragana: 'へんかさせています', english: 'are changing', level: 6, example: 'Tokyo の fashion scene を constantly に変化させています', exampleEn: 'Are constantly changing Tokyo\'s fashion scene' },
  '見られます': { japanese: '見られます', hiragana: 'みられます', english: 'can be seen', level: 5, example: 'fusion が見られます', exampleEn: 'fusion can be seen' },
  '文化': { japanese: '文化', hiragana: 'ぶんか', english: 'culture', level: 3, example: 'food culture を探索', exampleEn: 'exploring food culture' },
  '伝統': { japanese: '伝統', hiragana: 'でんとう', english: 'tradition', level: 3, example: 'blends 伝統 with', exampleEn: 'blends tradition with' },
  '桜': { japanese: '桜', hiragana: 'さくら', english: 'cherry blossom', level: 2, example: '桜の季節', exampleEn: 'cherry blossom season' },
  '季節': { japanese: '季節', hiragana: 'きせつ', english: 'season', level: 3, example: '桜の季節', exampleEn: 'cherry blossom season' },
  '原宿': { japanese: '原宿', hiragana: 'はらじゅく', english: 'Harajuku', level: 3, example: 'Street fashion の evolution in 原宿', exampleEn: 'Street fashion evolution in Harajuku' },
  '渋谷': { japanese: '渋谷', hiragana: 'しぶや', english: 'Shibuya', level: 3, example: '渋谷で会いましょう', exampleEn: 'Let\'s meet in Shibuya' },
  '大阪': { japanese: '大阪', hiragana: 'おおさか', english: 'Osaka', level: 2, example: '大阪\'s 創造性', exampleEn: 'Osaka\'s creativity' },
  '京都': { japanese: '京都', hiragana: 'きょうと', english: 'Kyoto', level: 2, example: '京都の伝統', exampleEn: 'Kyoto\'s tradition' },
  '九州': { japanese: '九州', hiragana: 'きゅうしゅう', english: 'Kyushu', level: 3, example: '九州\'s combination', exampleEn: 'Kyushu\'s combination' },
  '古い': { japanese: '古い', hiragana: 'ふるい', english: 'old', level: 2, example: 'respecting 古い ones', exampleEn: 'respecting old ones' },
  '生活': { japanese: '生活', hiragana: 'せいかつ', english: 'life/lifestyle', level: 3, example: 'new generation の生活 style', exampleEn: 'new generation\'s lifestyle' },
  '日本': { japanese: '日本', hiragana: 'にほん', english: 'Japan', level: 1, example: 'how 日本 blends', exampleEn: 'how Japan blends' },
  'イノベーション': { japanese: 'イノベーション', hiragana: 'いのべーしょん', english: 'innovation', level: 4, example: 'with イノベーション', exampleEn: 'with innovation' },

  // English words with proper Japanese translations
  'hidden': { japanese: 'hidden', hiragana: 'ひでん', english: '隠れた', level: 4, example: '地元の人だけが知る hidden ラーメン店', exampleEn: 'Hidden ramen shops that only locals know' },
  'culture': { japanese: 'culture', hiragana: 'かるちゃー', english: '文化', level: 4, example: '東京の最も busy な地区で地下の food culture を探索。', exampleEn: 'Exploring underground food culture in Tokyo\'s busiest districts.' },
  'business': { japanese: 'business', hiragana: 'びじねす', english: 'ビジネス', level: 5, example: 'これらの family-run business の店は何世代にもわたって authentic ラーメンを提供してきました。', exampleEn: 'These family-run business shops have been providing authentic ramen for many generations.' },
  'authentic': { japanese: 'authentic', hiragana: 'おーせんてぃっく', english: '本格的な', level: 6, example: 'これらの family-run business の店は何世代にもわたって authentic ラーメンを提供してきました。', exampleEn: 'These family-run business shops have been providing authentic ramen for many generations.' },
  'family-run': { japanese: 'family-run', hiragana: 'ふぁみりーらん', english: '家族経営の', level: 6, example: 'これらの family-run business の店は何世代にもわたって authentic ラーメンを提供してきました。', exampleEn: 'These family-run business shops have been providing authentic ramen for many generations.' },
  'food': { japanese: 'food', hiragana: 'ふーど', english: '食べ物', level: 3, example: '東京の最も busy な地区で地下の food culture を探索。', exampleEn: 'Exploring underground food culture in Tokyo\'s busiest districts.' },
  'busy': { japanese: 'busy', hiragana: 'びじー', english: '忙しい', level: 4, example: '東京の最も busy な地区で地下の food culture を探索。', exampleEn: 'Exploring underground food culture in Tokyo\'s busiest districts.' },
  'creativity': { japanese: 'creativity', hiragana: 'くりえいてぃびてぃ', english: '創造性', level: 5, example: 'Young people の creativity と self-expression', exampleEn: 'Young people\'s creativity and self-expression' },
  'self-expression': { japanese: 'self-expression', hiragana: 'せるふえくすぷれっしょん', english: '自己表現', level: 6, example: 'Young people の creativity と self-expression', exampleEn: 'Young people\'s creativity and self-expression' },
  'constantly': { japanese: 'constantly', hiragana: 'こんすたんとりー', english: '絶えず', level: 5, example: 'Tokyo の fashion scene を constantly に変化させています', exampleEn: 'Are constantly changing Tokyo\'s fashion scene' },
  'Traditional': { japanese: 'Traditional', hiragana: 'とらでぃしょなる', english: '伝統的な', level: 4, example: 'Traditional elements と modern trends', exampleEn: 'Traditional elements and modern trends' },
  'elements': { japanese: 'elements', hiragana: 'えれめんつ', english: '要素', level: 5, example: 'Traditional elements と modern trends の fusion', exampleEn: 'Fusion of traditional elements and modern trends' },
  'modern': { japanese: 'modern', hiragana: 'もだん', english: '現代の', level: 4, example: 'Traditional elements と modern trends', exampleEn: 'Traditional elements and modern trends' },
  'trends': { japanese: 'trends', hiragana: 'とれんず', english: 'トレンド', level: 4, example: 'Traditional elements と modern trends の fusion', exampleEn: 'Fusion of traditional elements and modern trends' },
  'fusion': { japanese: 'fusion', hiragana: 'ふゅーじょん', english: '融合', level: 5, example: 'Traditional elements と modern trends の fusion が見られます', exampleEn: 'Fusion of traditional elements and modern trends can be seen' },
  'Sakura': { japanese: 'Sakura', hiragana: 'さくら', english: '桜', level: 2, example: 'Sakura の季節は tourism industry に massive な boost をもたらします', exampleEn: 'Sakura season brings a massive boost to the tourism industry' },
  'sakura': { japanese: 'sakura', hiragana: 'さくら', english: '桜', level: 2, example: 'sakura season in Japan is legendary', exampleEn: '日本の桜の季節は伝説的です' },
  'tourism': { japanese: 'tourism', hiragana: 'つーりずむ', english: '観光', level: 3, example: 'Sakura の季節は tourism industry に massive な boost をもたらします', exampleEn: 'Sakura season brings a massive boost to the tourism industry' },
  'industry': { japanese: 'industry', hiragana: 'いんだすとりー', english: '産業', level: 4, example: 'Sakura の季節は tourism industry に massive な boost をもたらします', exampleEn: 'Sakura season brings a massive boost to the tourism industry' },
  'massive': { japanese: 'massive', hiragana: 'ますぃぶ', english: '大規模な', level: 5, example: 'Sakura の季節は tourism industry に massive な boost をもたらします', exampleEn: 'Sakura season brings a massive boost to the tourism industry' },
  'boost': { japanese: 'boost', hiragana: 'ぶーすと', english: '押し上げ', level: 5, example: 'Sakura の季節は tourism industry に massive な boost をもたらします', exampleEn: 'Sakura season brings a massive boost to the tourism industry' },
  'Local': { japanese: 'Local', hiragana: 'ろーかる', english: '地元の', level: 3, example: 'Local businesses は special events と limited-time products で visitors を attract しています', exampleEn: 'Local businesses are attracting visitors with special events and limited-time products' },
  'special': { japanese: 'special', hiragana: 'すぺしゃる', english: '特別な', level: 3, example: 'Local businesses は special events と limited-time products で visitors を attract しています', exampleEn: 'Local businesses are attracting visitors with special events and limited-time products' },
  'events': { japanese: 'events', hiragana: 'いべんつ', english: 'イベント', level: 3, example: 'Local businesses は special events と limited-time products で visitors を attract しています', exampleEn: 'Local businesses are attracting visitors with special events and limited-time products' },
  'limited-time': { japanese: 'limited-time', hiragana: 'りみてっどたいむ', english: '期間限定の', level: 6, example: 'Local businesses は special events と limited-time products で visitors を attract しています', exampleEn: 'Local businesses are attracting visitors with special events and limited-time products' },
  'products': { japanese: 'products', hiragana: 'ぷろだくつ', english: '商品', level: 4, example: 'Local businesses は special events と limited-time products で visitors を attract しています', exampleEn: 'Local businesses are attracting visitors with special events and limited-time products' },
  'visitors': { japanese: 'visitors', hiragana: 'びじたーず', english: '訪問者', level: 4, example: 'limited-time products で visitors を attract', exampleEn: 'Attract visitors with limited-time products' },
  'attract': { japanese: 'attract', hiragana: 'あとらくと', english: '引きつける', level: 5, example: 'limited-time products で visitors を attract', exampleEn: 'Attract visitors with limited-time products' },
  'tradition': { japanese: 'tradition', hiragana: 'とらでぃしょん', english: '伝統', level: 3, example: '古い tradition と new generation', exampleEn: 'Old tradition and new generation' },
  'generation': { japanese: 'generation', hiragana: 'じぇねれーしょん', english: '世代', level: 4, example: 'new generation の生活 style', exampleEn: 'new generation\'s lifestyle' },
  'style': { japanese: 'style', hiragana: 'すたいる', english: 'スタイル', level: 3, example: 'new generation の生活 style が融合', exampleEn: 'new generation\'s lifestyle merges' },
  'Young': { japanese: 'Young', hiragana: 'やんぐ', english: '若い', level: 2, example: 'Young Japanese people は tea ceremony を modern way で楽しんでいます', exampleEn: 'Young Japanese people enjoy tea ceremony in a modern way' },
  'people': { japanese: 'people', hiragana: 'ぴーぷる', english: '人々', level: 2, example: 'Young people の creativity', exampleEn: 'Young people\'s creativity' },
  'Tokyo': { japanese: 'Tokyo', hiragana: 'とうきょう', english: '東京', level: 1, example: 'Tokyo の fashion scene', exampleEn: 'Tokyo\'s fashion scene' },

  // Common English words that might appear in comments
  'ran': { japanese: 'ran', hiragana: 'らん', english: '走った', level: 3, example: 'I ran to the store', exampleEn: '私は店に走りました' },
  'run': { japanese: 'run', hiragana: 'らん', english: '走る', level: 2, example: 'I like to run', exampleEn: '私は走るのが好きです' },
  'running': { japanese: 'running', hiragana: 'らんにんぐ', english: '走っている', level: 3, example: 'I am running', exampleEn: '私は走っています' },
  'this': { japanese: 'this', hiragana: 'でぃす', english: 'これ', level: 1, example: 'This is good', exampleEn: 'これは良いです' },
  'that': { japanese: 'that', hiragana: 'ざっと', english: 'それ', level: 1, example: 'That is interesting', exampleEn: 'それは面白いです' },
  'and': { japanese: 'and', hiragana: 'あんど', english: 'そして', level: 1, example: 'You and me', exampleEn: 'あなたと私' },
  'good': { japanese: 'good', hiragana: 'ぐっど', english: '良い', level: 1, example: 'This is good', exampleEn: 'これは良いです' },
  'wait': { japanese: 'wait', hiragana: 'うぇいと', english: '待つ', level: 2, example: 'Please wait', exampleEn: '待ってください' },
  'can': { japanese: 'can', hiragana: 'きゃん', english: 'できる', level: 2, example: 'I can do it', exampleEn: '私はそれができます' },
  'will': { japanese: 'will', hiragana: 'うぃる', english: 'するでしょう', level: 2, example: 'I will go', exampleEn: '私は行くでしょう' },
  'my': { japanese: 'my', hiragana: 'まい', english: '私の', level: 1, example: 'This is my book', exampleEn: 'これは私の本です' },
  'you': { japanese: 'you', hiragana: 'ゆー', english: 'あなた', level: 1, example: 'How are you?', exampleEn: 'あなたは元気ですか？' },
  'it': { japanese: 'it', hiragana: 'いっと', english: 'それ', level: 1, example: 'I like it', exampleEn: '私はそれが好きです' },
  
  // Additional words from comments
  'Italy': { japanese: 'Italy', hiragana: 'いたりー', english: 'イタリア', level: 2, example: 'Italy has beautiful springs', exampleEn: 'イタリアには美しい泉があります' },
  'has': { japanese: 'has', hiragana: 'はず', english: '持っている', level: 2, example: 'Italy has beautiful springs', exampleEn: 'イタリアには美しい泉があります' },
  'beautiful': { japanese: 'beautiful', hiragana: 'びゅーてぃふる', english: '美しい', level: 3, example: 'Italy has beautiful springs', exampleEn: 'イタリアには美しい泉があります' },
  'springs': { japanese: 'springs', hiragana: 'すぷりんぐず', english: '泉', level: 4, example: 'Italy has beautiful springs', exampleEn: 'イタリアには美しい泉があります' },
  'too': { japanese: 'too', hiragana: 'とぅー', english: 'も', level: 1, example: 'Italy has beautiful springs too', exampleEn: 'イタリアにも美しい泉があります' },
  'but': { japanese: 'but', hiragana: 'ばっと', english: 'しかし', level: 2, example: 'Italy has beautiful springs too, but sakura season in Japan is legendary', exampleEn: 'イタリアにも美しい泉がありますが、日本の桜の季節は伝説的です' },
  'season': { japanese: 'season', hiragana: 'しーずん', english: '季節', level: 3, example: 'sakura season in Japan is legendary', exampleEn: '日本の桜の季節は伝説的です' },
  'in': { japanese: 'in', hiragana: 'いん', english: 'で', level: 1, example: 'sakura season in Japan', exampleEn: '日本での桜の季節' },
  'Japan': { japanese: 'Japan', hiragana: 'じゃぱん', english: '日本', level: 1, example: 'sakura season in Japan is legendary', exampleEn: '日本の桜の季節は伝説的です' },
  'is': { japanese: 'is', hiragana: 'いず', english: 'です', level: 1, example: 'sakura season in Japan is legendary', exampleEn: '日本の桜の季節は伝説的です' },
  'legendary': { japanese: 'legendary', hiragana: 'れじぇんだりー', english: '伝説的な', level: 5, example: 'sakura season in Japan is legendary', exampleEn: '日本の桜の季節は伝説的です' },
  'The': { japanese: 'The', hiragana: 'ざ', english: 'その', level: 1, example: 'The limited time makes it even more special', exampleEn: '限られた時間がそれをさらに特別にします' },
  'limited': { japanese: 'limited', hiragana: 'りみてっど', english: '限られた', level: 4, example: 'The limited time makes it even more special', exampleEn: '限られた時間がそれをさらに特別にします' },
  'time': { japanese: 'time', hiragana: 'たいむ', english: '時間', level: 2, example: 'The limited time makes it even more special', exampleEn: '限られた時間がそれをさらに特別にします' },
  'makes': { japanese: 'makes', hiragana: 'めいくす', english: 'する', level: 2, example: 'The limited time makes it even more special', exampleEn: '限られた時間がそれをさらに特別にします' },
  'even': { japanese: 'even', hiragana: 'いーぶん', english: 'さらに', level: 3, example: 'makes it even more special', exampleEn: 'それをさらに特別にします' },
  'more': { japanese: 'more', hiragana: 'もあ', english: 'もっと', level: 2, example: 'makes it even more special', exampleEn: 'それをさらに特別にします' },
  'special': { japanese: 'special', hiragana: 'すぺしゃる', english: '特別な', level: 3, example: 'makes it even more special', exampleEn: 'それをさらに特別にします' },
  'and': { japanese: 'and', hiragana: 'あんど', english: 'そして', level: 1, example: 'special and valuable', exampleEn: '特別で価値のある' },
  'valuable': { japanese: 'valuable', hiragana: 'ばりゅあぶる', english: '価値のある', level: 4, example: 'makes it even more special and valuable', exampleEn: 'それをさらに特別で価値のあるものにします' },
  
  // Common words that might appear
  'Thank': { japanese: 'Thank', hiragana: 'さんく', english: 'ありがとう', level: 1, example: 'Thank you for your help', exampleEn: 'あなたの助けをありがとう' },
  'cuisine': { japanese: 'cuisine', hiragana: 'くいじーん', english: '料理', level: 3, example: 'Traditional takoyaki と okonomiyaki に加えて、fusion cuisine が人気。Korean-Japanese と Italian-Japanese の combination が特に popular です。', exampleEn: 'In addition to traditional takoyaki and okonomiyaki, fusion cuisine is popular. Korean-Japanese and Italian-Japanese combinations are especially popular.' },
  'thank': { japanese: 'thank', hiragana: 'さんく', english: 'ありがとう', level: 1, example: 'I thank you', exampleEn: '私はあなたに感謝します' },
  'Thanks': { japanese: 'Thanks', hiragana: 'さんくす', english: 'ありがとう', level: 1, example: 'Thanks for everything', exampleEn: 'すべてをありがとう' },
  'thanks': { japanese: 'thanks', hiragana: 'さんくす', english: 'ありがとう', level: 1, example: 'thanks for your time', exampleEn: 'あなたの時間をありがとう' }
};

// Helper function to provide basic English-to-Japanese translations
const getBasicEnglishTranslation = (word) => {
  const basicTranslations = {
    // Common verbs
    'thank': 'ありがとう',
    'Thank': 'ありがとう', 
    'thanks': 'ありがとう',
    'Thanks': 'ありがとう',
    'help': '助ける',
    'like': '好き',
    'love': '愛する',
    'want': '欲しい',
    'need': '必要',
    'know': '知る',
    'think': '思う',
    'feel': '感じる',
    'see': '見る',
    'hear': '聞く',
    'say': '言う',
    'tell': '話す',
    'ask': '聞く',
    'answer': '答える',
    'come': '来る',
    'go': '行く',
    'get': '得る',
    'give': '与える',
    'take': '取る',
    'make': '作る',
    'do': 'する',
    'have': '持つ',
    'be': 'である',
    
    // Common adjectives
    'good': '良い',
    'bad': '悪い',
    'big': '大きい',
    'small': '小さい',
    'new': '新しい',
    'old': '古い',
    'hot': '熱い',
    'cold': '冷たい',
    'fast': '速い',
    'slow': '遅い',
    'easy': '簡単',
    'hard': '難しい',
    'happy': '幸せ',
    'sad': '悲しい',
    
    // Common nouns
    'person': '人',
    'people': '人々',
    'man': '男性',
    'woman': '女性',
    'child': '子供',
    'family': '家族',
    'friend': '友達',
    'house': '家',
    'car': '車',
    'book': '本',
    'food': '食べ物',
    'water': '水',
    'money': 'お金',
    'work': '仕事',
    'school': '学校',
    'country': '国',
    'city': '都市',
    'world': '世界',
  'cuisine': '料理',
  'traditional': '伝統的な',
  'fusion': '融合',
  'popular': '人気',
  'combination': 'コンビネーション'
  };
  
  return basicTranslations[word] || `${word}の日本語`;
};

// Predefined sentence translations for common contexts
const getSentenceTranslation = (sentence, targetWord, wordTranslation) => {
  // Common sentence patterns with their translations
  const sentenceTranslations = {
    'Italy has beautiful springs too, but sakura season in Japan is legendary!': 'イタリアにも美しい泉がありますが、日本の桜の季節は伝説的です！',
    'The limited time makes it even more special and valuable.': '限られた時間がそれをさらに特別で価値のあるものにします。',
    'Thank you for your help': 'あなたの助けをありがとう',
    'Thank you': 'ありがとう',
    'This is amazing': 'これは素晴らしいです',
    'I love this place': 'この場所が大好きです',
    'sakura season in Japan is legendary': '日本の桜の季節は伝説的です'
  };

  // Check for exact matches first
  const exactMatch = sentenceTranslations[sentence];
  if (exactMatch) {
    return exactMatch;
  }

  // Check for partial matches
  for (const [englishSentence, japaneseSentence] of Object.entries(sentenceTranslations)) {
    if (sentence.includes(englishSentence) || englishSentence.includes(sentence)) {
      return japaneseSentence;
    }
  }

  // Fallback: simple word replacement for unknown sentences
  const basicTranslations = {
    'Italy': 'イタリア',
    'has': 'には',
    'beautiful': '美しい',
    'springs': '泉が',
    'too': 'も',
    'but': 'ありますが',
    'sakura': '桜の',
    'season': '季節は',
    'in': '',
    'Japan': '日本の',
    'is': '',
    'legendary': '伝説的です',
    'The': '',
    'limited': '限られた',
    'time': '時間が',
    'makes': '',
    'it': 'それを',
    'even': 'さらに',
    'more': 'もっと',
    'special': '特別で',
    'and': '',
    'valuable': '価値のあるものにします',
    'Thank': 'ありがとう',
    'you': '',
    'for': 'を',
    'your': 'あなたの',
    'help': '助け'
  };

  // Add the target word translation
  basicTranslations[targetWord] = wordTranslation;

  // Simple word replacement as fallback
  let result = sentence;
  Object.keys(basicTranslations).forEach(englishWord => {
    if (basicTranslations[englishWord]) {
      const regex = new RegExp(`\\b${englishWord}\\b`, 'gi');
      result = result.replace(regex, basicTranslations[englishWord]);
    }
  });

  return result;
};

// Function to handle word clicks with real-time translation API
export const handleWordClick = async (word, setSelectedWord, isJapanese = null, context = null, contextTranslation = null) => {
  // Auto-detect if word is Japanese or English if not specified
  if (isJapanese === null) {
    isJapanese = /[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]/.test(word);
  }

  // Clean the word (remove punctuation)
  const cleanWord = word.replace(/[。、！？]/g, '');
  const wordData = japaneseWords[cleanWord];
  
  if (wordData) {
    // Use existing database entry if available
    if (!isJapanese) {
      setSelectedWord({
        japanese: wordData.japanese, // Keep original English word
        hiragana: wordData.hiragana, // Katakana pronunciation
        english: wordData.english, // Japanese translation
        level: wordData.level,
        example: wordData.example,
        exampleEn: wordData.exampleEn,
        original: cleanWord,
        isJapanese: false,
        showJapaneseTranslation: true
      });
    } else {
      setSelectedWord({
        ...wordData,
        original: cleanWord,
        isJapanese: isJapanese
      });
    }
  } else {
    // Use translation API for unknown words
    try {
      console.log(`Translating word: ${cleanWord} using API...`);
      
      let translation, pronunciation, contextTranslation;
      
      if (isJapanese) {
        // Japanese to English
        translation = await translationService.translateText(cleanWord, 'ja', 'en');
        pronunciation = translationService.getBasicReading(cleanWord);
        
        if (context && !contextTranslation) {
          contextTranslation = await translationService.translateText(context, 'ja', 'en');
        }
      } else {
        // English to Japanese
        translation = await translationService.translateText(cleanWord, 'en', 'ja');
        pronunciation = translationService.getEnglishPronunciation(cleanWord);
        
        if (context && !contextTranslation) {
          contextTranslation = await translationService.translateText(context, 'en', 'ja');
        }
      }
      
      const level = translationService.estimateLevel(cleanWord);
      
      setSelectedWord({
        japanese: isJapanese ? cleanWord : cleanWord,
        hiragana: pronunciation,
        english: translation,
        level: level,
        example: context || `Example with "${cleanWord}".`,
        exampleEn: contextTranslation || (isJapanese ? `Example with ${cleanWord}.` : `「${cleanWord}」を使った例文。`),
        original: cleanWord,
        isJapanese: isJapanese,
        showJapaneseTranslation: !isJapanese,
        isApiTranslated: true // Flag to indicate this came from API
      });
      
    } catch (error) {
      console.error('Translation API failed:', error);
      
      // Fallback to basic translation if API fails
      const basicTranslation = isJapanese ? 'Japanese word' : getBasicEnglishTranslation(cleanWord);
      const basicPronunciation = isJapanese ? cleanWord : cleanWord.toLowerCase();
      
      setSelectedWord({
        japanese: cleanWord,
        hiragana: basicPronunciation,
        english: basicTranslation,
        level: 5,
        example: context || `Example with "${cleanWord}".`,
        exampleEn: context || `「${cleanWord}」を使った例文。`,
        original: cleanWord,
        isJapanese: isJapanese,
        showJapaneseTranslation: !isJapanese,
        isApiFallback: true // Flag to indicate API failed
      });
    }
  }
};

// Function to add word to dictionary
export const addWordToDictionary = (selectedWord, userDictionary, setUserDictionary, setFeedbackMessage, setShowFeedback) => {
  if (selectedWord) {
    let wordToAdd;
    
    if (selectedWord.showJapaneseTranslation) {
      // English word - add the Japanese translation to dictionary
      wordToAdd = {
        japanese: selectedWord.english, // Japanese translation
        hiragana: selectedWord.hiragana, // Katakana pronunciation
        english: selectedWord.japanese, // Original English word
        level: selectedWord.level,
        example: selectedWord.example,
        exampleEn: selectedWord.exampleEn,
        source: "LivePeek"
      };
    } else {
      // Japanese word - add normally
      wordToAdd = {
        japanese: selectedWord.japanese,
        hiragana: selectedWord.hiragana,
        english: selectedWord.english,
        level: selectedWord.level,
        example: selectedWord.example,
        exampleEn: selectedWord.exampleEn,
        source: "LivePeek"
      };
    }

    // Check if word already exists
    const wordExists = userDictionary.some(word => word.japanese === wordToAdd.japanese);
    
    if (!wordExists) {
      setUserDictionary(prev => [...prev, wordToAdd]);
      setFeedbackMessage({
        icon: "📚",
        message: "Added to your dictionary!"
      });
    } else {
      setFeedbackMessage({
        icon: "ℹ️",
        message: "Already in your dictionary"
      });
    }
    
    setShowFeedback(true);
    setTimeout(() => {
      setShowFeedback(false);
      setFeedbackMessage(null);
    }, 2000);
  }
};
