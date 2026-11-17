/* =========================================================
   LLS — Ready-to-use kits for the Quick activities A–Z (17 Nov 2026, owner: "the idea of these games is they are
   ready to go, so they need the sentences or whatever ready for the teacher").
   Each game gets one or more sets: [title, [items]].
   Item formats:  "text → answer"  = the answer stays hidden until the teacher reveals it.
                  "word|banned1,banned2,banned3" = a Taboo-style card (banned words shown under the word).
   Loaded AFTER activities.js; it attaches .kit to each game. Written by us (no copied material).
========================================================= */
(function () {
  "use strict";
  const K = {
    /* ---------------- TEENS & ADULTS ---------------- */
    "A to Z race": [
      ["Topics (choose one)", ["Food and drink", "Jobs", "Things in a house", "Travel and holidays", "Clothes and accessories", "Adjectives to describe people", "Verbs (say the past simple too!)", "Shopping"]],
      ["Model answers: food and drink", ["A – apple, avocado", "B – bread, biscuit", "C – cheese, carrot", "D – doughnut", "E – egg", "F – fish, figs", "G – grapes", "H – honey, ham", "I – ice cream", "J – jam, juice", "K – kiwi", "L – lemon, lettuce", "M – milk, mushrooms", "N – noodles, nuts", "O – olives, onion", "P – pasta, pear", "Q – quiche", "R – rice", "S – sugar, salad", "T – tea, tomato", "U – (hard! no points lost)", "V – vinegar", "W – water, watermelon", "X – (skip)", "Y – yoghurt", "Z – zucchini (the American word for courgette)"]]
    ],
    "Agony aunt": [
      ["Problems to hand out (if students are stuck)", ["My flatmate never washes up.", "I can't stop checking my phone at night.", "My best friend always arrives an hour late.", "My boss sends me emails at 11 p.m.", "I want to learn the guitar but I never have time.", "My neighbour's dog barks all day.", "I spent all my money and it's only the 10th of the month.", "My mum wants me to study medicine, but I want to be a chef.", "I'm always tired in the morning.", "I forgot my partner's birthday."]],
      ["Advice phrases (on the board)", ["You should… / You shouldn't…", "If I were you, I'd…", "Why don't you…?", "Have you tried …-ing?", "It might be a good idea to…", "Whatever you do, don't…"]]
    ],
    "Alibi": [
      ["The crime (read it to the class)", ["Last night, between 7 and 10 p.m., someone took the money box from Bar Aurora in Bagheria.", "Two customers left at the same time as the money disappeared.", "They say they were together all evening: first dinner at a pizzeria, then a film at the cinema.", "The suspects have 5 minutes outside to agree every detail."]],
      ["Questions for the class to ask", ["Where were you at 7.15?", "What were you wearing?", "Who arrived at the pizzeria first?", "What did you each eat and drink?", "Who paid, and how?", "What was the waiter doing when you left?", "How did you get to the cinema?", "What was the weather like?", "What film did you see? Where were you sitting?", "What were you talking about during dinner?", "Was anyone else with you?", "What time did you get home?"]]
    ],
    "Back to the board": [
      ["A2 everyday words", ["umbrella", "fridge", "passport", "breakfast", "toothbrush", "bus stop", "birthday", "pharmacy", "sunglasses", "homework", "neighbour", "weekend"]],
      ["B1 words", ["receipt", "traffic jam", "landlord", "interview", "lazy", "to borrow", "embarrassed", "a bargain", "colleague", "to complain", "dishwasher", "a delay"]],
      ["B2 words", ["to procrastinate", "deadline", "a hangover", "to apologise", "stubborn", "a mortgage", "to overtake", "jealous", "a rumour", "to persuade", "sustainable", "commute"]]
    ],
    "Backshift or not?": [
      ["Report these (did the tense change?)", ["'I'm tired.' (your friend, this morning) → She said she was tired. (backshift – it was true then)", "'The sun is a star.' (your teacher) → He said the sun is a star. (no backshift – always true)", "'I'll call you tonight.' (your brother, yesterday) → He said he would call me that night.", "'Rome is the capital of Italy.' → She said Rome is the capital of Italy. (still true)", "'I've lost my keys.' (last week) → He said he had lost his keys.", "'I'm getting married in June.' (said in January, it's now March) → She said she's getting / was getting married in June. (both OK – it's still in the future)", "'I don't like fish.' (your cousin – still true) → He said he doesn't / didn't like fish. (both OK)", "'We went to Palermo.' → They said they had gone / went to Palermo."]]
    ],
    "Call my bluff": [
      ["Rare words (real meaning after →)", ["SNOLLYGOSTER: a) a ghost b) a dishonest politician c) a sweet snack → b", "KERFUFFLE: a) a fuss, a commotion b) a fluffy pillow c) a cough → a", "LOLLYGAG: a) a lollipop b) to waste time c) a joke → b", "WIDDERSHINS: a) anticlockwise b) shiny shoes c) a widow → a", "COLLYWOBBLES: a) a jelly b) a nervous stomach c) a sheepdog → b", "GOBBLEDYGOOK: a) a turkey b) nonsense language c) a sticky sauce → b", "FLIBBERTIGIBBET: a) a silly, chatty person b) a small bird c) a broken tool → a", "CATTYWAMPUS: a) a cat bed b) crooked, not straight c) a party → b", "BUMFUZZLE: a) to confuse b) a bee c) a hairstyle → a"]]
    ],
    "Categories (Stop!)": [
      ["Category sets", ["food · job · country · verb · adjective", "animal · clothes · city · sport · something in the kitchen", "drink · body part · famous person · something in a bag · feeling", "film or TV show · transport · school subject · hobby · colour"]],
      ["Good letters to call", ["B", "C", "D", "F", "G", "L", "M", "P", "S", "T"]],
      ["Model answers", ["B → banana · baker · Brazil · borrow · boring", "S → salad · singer · Spain · swim · small", "P → pasta · pilot · Portugal · play · polite", "T → tomato · teacher · Turkey · travel · tired"]]
    ],
    "Chain story": [
      ["Story starters", ["Yesterday I went to Palermo and…", "When I opened the door, there was a goat in my kitchen…", "It was 3 a.m. and my phone rang…", "The plane was about to land when the captain said…", "I found a wallet with €5,000 in it…", "On the first day of my new job…", "The lights went out in the middle of dinner…", "I woke up and I was 10 years old again…"]],
      ["Connectors (on the board)", ["then", "after that", "suddenly", "so", "because", "but", "while", "luckily", "unfortunately", "in the end"]]
    ],
    "Debate ladder": [
      ["Statements", ["Social media does more harm than good.", "Homework should be banned.", "It's better to live in a city than in the countryside.", "Children should get a phone at 10.", "Tourists are good for Sicily.", "Money makes people happy.", "Everyone should learn to cook at school.", "Working from home is better than working in an office.", "Football players earn too much.", "Pineapple belongs on pizza."]],
      ["Useful phrases", ["In my opinion…", "I see your point, but…", "That's true, however…", "I completely disagree because…", "What about…?", "For example…"]]
    ],
    "Desert island": [
      ["Ideas list (for students who are stuck)", ["a knife", "a rope", "a phone with no signal", "a guitar", "a box of matches", "a fishing net", "a bag of rice", "a book", "sun cream", "a mirror", "a blanket", "a football", "a saucepan", "a pair of trainers", "a photo of your family"]],
      ["Language (on the board)", ["I'd take… because I could…", "We wouldn't need… because…", "What about…? We could use it to…", "OK, so we agree on…"]]
    ],
    "Excuses, excuses!": [
      ["Teacher's angry questions", ["Why are you late?", "Why didn't you do your homework?", "Why didn't you answer my calls?", "Why is your room such a mess?", "Why are you wearing pyjamas at work?", "Where's my car?!", "Why did you eat my sandwich?", "Why weren't you at the meeting?"]],
      ["Model answers", ["I'm sorry – I was rescuing a cat from a tree when the fire brigade arrived…", "I was doing it when my dog ate it, I promise!", "I was swimming with dolphins and my phone was in the boat."]]
    ],
    "Find someone who…": [
      ["Present perfect", ["…has been to London", "…has eaten sushi", "…has broken a bone", "…has met a famous person", "…has never driven a car", "…has lived in another country", "…has lost their phone this year", "…has seen the sunrise this month"]],
      ["Present simple / can", ["…can cook a risotto", "…gets up before 7", "…plays an instrument", "…doesn't drink coffee", "…can speak three languages", "…goes to the gym", "…has got a pet", "…lives near the sea"]],
      ["Past simple", ["…went to the cinema last week", "…was born in a different city", "…had pasta yesterday", "…got up late on Sunday", "…bought something online this week", "…saw a friend last night", "…didn't sleep well", "…walked to class today"]],
      ["Future", ["…is going out tonight", "…is going to travel this year", "…will be at home this weekend", "…is meeting a friend tomorrow", "…is going to cook tonight", "…wants to change job", "…is going to buy something big", "…will watch a match on Sunday"]]
    ],
    "Fishbowl": [
      ["Questions", ["Is it better to rent or buy a house?", "Should people retire at 60 or 70?", "Are exams the best way to test students?", "Should Bagheria close the town centre to cars?", "Is it OK to lie to protect someone's feelings?", "Should young people stay in Sicily or move abroad?", "Do we need a car in the future?", "Is it better to be an only child?"]]
    ],
    "Fortune teller": [
      ["Areas to predict", ["love", "job", "money", "travel", "family", "house", "health", "fame"]],
      ["Sentence frames", ["You're going to meet…", "You'll be rich, but…", "You might move to…", "You won't… until you're…", "Next year you're going to…", "I see a… in your future!"]]
    ],
    "Go-betweens": [
      ["Situations (A and B don't speak to each other)", ["Neighbours: A plays loud music at night. B parks in A's space.", "Flatmates: A never cleans the bathroom. B eats A's food.", "Brother and sister: both want the car on Saturday night.", "Colleagues: A takes long phone calls at the desk. B is always late for meetings.", "Parents and teenager: the teenager wants to come home at 2 a.m., the parents say 11."]],
      ["Language for the go-between", ["She said that…", "He told me to tell you that…", "She asked if you would…", "He wants to know whether…", "She promised she would…"]]
    ],
    "Guess who said it": [
      ["Who could say it? (role cards)", ["a dentist", "a police officer", "your mum", "a waiter", "a hairdresser", "a football coach", "a doctor", "a teacher", "a flight attendant", "a shop assistant"]],
      ["Model sentences (guess the person)", ["She told me to open wide and asked if it hurt. → the dentist", "He asked me where I was going and told me to show my licence. → a police officer", "She asked how I wanted it and said it would look great short. → the hairdresser", "He told me to fasten my seatbelt and switch off my phone. → a flight attendant", "She said I'd forgotten my jacket again and told me to eat my vegetables. → mum", "He told me to run faster and said I'd be on the team on Sunday. → a football coach"]]
    ],
    "Hot seat": [
      ["Characters (one card per student)", ["a famous footballer", "a pop star", "the President of Italy", "a Martian visiting Earth", "a 100-year-old woman from Bagheria", "a ghost in a castle", "a lottery winner", "a detective", "a chef in a famous restaurant", "Santa Claus in July"]]
    ],
    "I went to the market…": [
      ["Versions", ["I went to the market and I bought… (food)", "I packed my suitcase and I took… (clothes / travel)", "I went to the zoo and I saw… (animals)", "Yesterday I… (past simple verbs: ate a pizza, lost my keys…)"]],
      ["Help words (food)", ["apples", "a kilo of tomatoes", "bread", "cheese", "olives", "a fish", "eggs", "lemons", "a melon", "potatoes", "onions", "a bottle of oil"]]
    ],
    "Just a minute": [
      ["Topics", ["my worst holiday", "Mondays", "my phone", "the best food in Sicily", "shopping", "my first job", "the weather", "a person I admire", "breakfast", "social media", "my bedroom", "a film I love", "learning English", "cars", "my town", "the perfect weekend"]]
    ],
    "Kim's game": [
      ["10 things to find in your bag or desk", ["keys", "phone", "pen", "coin", "glasses", "a book", "a tissue", "a lipstick / lip balm", "a receipt", "a USB stick"]],
      ["Language", ["There was a… next to the…", "The… was on top of / under / between…", "There were two…", "I think the… is missing."]]
    ],
    "Liar, liar!": [
      ["Story prompts (true or invented)", ["A time you got lost", "The strangest food you've eaten", "A famous person you met", "Your worst day at school", "Something you broke", "A time you were really scared", "The best present you got", "A time you got into trouble"]],
      ["Questions to ask", ["When did it happen?", "Where were you?", "Who were you with?", "What happened next?", "How did you feel?"]]
    ],
    "Line-up": [
      ["Line up by… (and the question to ask)", ["birthday (January → December) – 'When's your birthday?'", "how far you live from school – 'How far do you live from here?'", "bedtime – 'What time do you go to bed?'", "number of brothers and sisters – 'How many… have you got?'", "how many countries you've visited – 'How many countries have you been to?'", "first name A–Z – 'How do you spell your name?'", "how long you've studied English – 'How long have you studied English?'", "shoe size – 'What size are your shoes?'"]]
    ],
    "Mime the adverb": [
      ["Verb + adverb cards", ["eat spaghetti angrily", "brush your teeth slowly", "dance happily", "drive nervously", "read a letter sadly", "walk quietly", "open a present excitedly", "sing badly", "cook carefully", "type quickly", "climb the stairs tiredly", "eat ice cream greedily"]]
    ],
    "Mystery object": [
      ["Object cards", ["bottle opener", "umbrella", "toothbrush", "remote control", "hairdryer", "frying pan", "charger", "scissors", "pillow", "wallet", "tin opener", "coat hanger"]],
      ["Language", ["It's made of… (metal, plastic, wood, glass)", "It's (round / long / soft…)", "You use it to…", "You find it in the…", "It's bigger / smaller than a…"]]
    ],
    "Never have I ever": [
      ["Sentences", ["Never have I ever eaten sushi.", "Never have I ever been to London.", "Never have I ever fallen asleep in class.", "Never have I ever sung karaoke.", "Never have I ever broken a bone.", "Never have I ever lost my keys.", "Never have I ever cooked for 10 people.", "Never have I ever been on TV.", "Never have I ever missed a flight.", "Never have I ever swum in the sea in winter.", "Never have I ever forgotten a friend's birthday.", "Never have I ever ridden a horse."]]
    ],
    "Odd one out": [
      ["Word groups (one possible answer → but accept any good reason)", ["nephew · niece · cousin · stepmother → stepmother (not blood family)", "apple · banana · carrot · pear → carrot (a vegetable)", "doctor · nurse · dentist · lawyer → lawyer (not health)", "went · saw · played · bought → played (regular verb)", "happy · angry · tall · nervous → tall (not a feeling)", "train · bus · plane · ticket → ticket (not transport)", "kitchen · bedroom · garden · bathroom → garden (not inside)", "cheap · expensive · price · free → price (a noun)", "bake · boil · fry · chop → chop (no heat)", "always · usually · yesterday · never → yesterday (not frequency)"]]
    ],
    "Opinion corners": [
      ["Statements", ["Children should learn English from age 3.", "Exams are the best way to test students.", "Everybody should do a sport.", "It's rude to look at your phone at dinner.", "Summer is the best season.", "Video games are good for children.", "Teenagers should have a part-time job.", "Breakfast is the most important meal.", "School uniforms are a good idea.", "It's better to be rich than famous."]]
    ],
    "Password": [
      ["Words (A sees, B guesses)", ["receipt", "pillow", "airport", "holiday", "cousin", "kitchen", "doctor", "rain", "wedding", "ticket", "beach", "breakfast"]]
    ],
    "Picture dictation": [
      ["Scene 1 (A2) – read it slowly", ["In the middle of the picture there's a big house.", "There are two windows and a red door.", "On the left of the house there's a tall tree.", "A cat is sitting under the tree.", "In the sky there are three birds and the sun is on the right.", "In front of the house there's a car."]],
      ["Scene 2 (B1) – read it slowly", ["It's a beach. The sea is at the top of the picture.", "In the bottom left corner, a man is sleeping under an umbrella.", "Next to him there's a dog with a ball in its mouth.", "Two children are building a sandcastle in the middle.", "On the right, a woman is selling ice creams from a small van.", "There's a boat on the sea, between two big waves."]]
    ],
    "Question tennis": [
      ["Topics", ["yesterday", "the weekend", "food", "holidays", "school / work", "a secret", "the weather", "your family"]],
      ["Start the rally with…", ["Where were you yesterday?", "What are you doing this weekend?", "Why are you smiling?", "Do you like my shoes?", "Have you got a minute?"]]
    ],
    "Real or invented?": [
      ["Prompts", ["Something a teacher once told you", "Something your grandmother always says", "Something a stranger said to you", "Something a doctor told you", "Something a friend asked you to do", "Something your boss / coach said", "Something a waiter said", "Something you were told as a child"]]
    ],
    "Reported mingle": [
      ["Questions (one card per student)", ["Have you ever been to Rome?", "What did you have for breakfast?", "Where are you going on holiday?", "Do you like horror films?", "What will you do this evening?", "Can you play an instrument?", "What's your favourite app?", "Have you got any brothers or sisters?", "Did you sleep well?", "Are you going to cook tonight?", "Who's your favourite singer?", "What did you do last weekend?"]],
      ["Model", ["Marco told me he had never been to Rome.", "Sara said she was going to Spain.", "I asked Luca if he could play an instrument and he said he could."]]
    ],
    "Role-play on the spot": [
      ["Situations (A / B)", ["Restaurant – A: your soup is cold. B: a rude waiter.", "Shop – A: you want to return a jumper without the receipt. B: shop assistant.", "Hotel – A: there's no hot water. B: receptionist.", "Doctor – A: you've got a strange pain. B: doctor.", "Airport – A: your suitcase is lost. B: airline worker.", "Phone – A: you want to book a table for 8. B: the restaurant is full at 8.", "Neighbour – A: B's music is too loud. B: it's your birthday party.", "Taxi – A: the driver went the long way. B: taxi driver.", "Job interview – A: candidate. B: interviewer.", "Station – A: you've missed the last train. B: ticket office."]]
    ],
    "Running dictation": [
      ["Text A2 (stick on the wall)", ["Marta lives in Bagheria with her two cats.", "Every morning she gets up at seven and has a coffee on her balcony.", "She works in a shop in Palermo, so she takes the train.", "On Saturdays she goes to the market and buys fresh fish.", "In the evening she likes watching films with her friends."]],
      ["Text B1 (stick on the wall)", ["Last summer Luca decided to cycle around Sicily.", "He had never cycled more than twenty kilometres before.", "On the third day his bike broke near Cefalù, and it started to rain.", "A farmer saw him and invited him to stay for dinner.", "Luca didn't finish the tour, but he made a friend for life."]]
    ],
    "Sentence auction": [
      ["A2–B1 sentences (✓ correct / ✗ wrong)", ["I'm not knowing his name. → ✗ I don't know his name.", "She has lived here since three years. → ✗ for three years", "We went to the beach yesterday. → ✓", "He doesn't like coffee. → ✓", "I am agree with you. → ✗ I agree with you.", "Where did you go last summer? → ✓", "She's taller than her brother. → ✓", "I have 25 years. → ✗ I'm 25.", "There are many people in the square. → ✓", "Can you explain me the rule? → ✗ explain the rule to me"]],
      ["B1–B2 sentences", ["If I would have time, I'd help you. → ✗ If I had time", "I'm used to getting up early. → ✓", "She told that she was tired. → ✗ She said / told me", "I've been waiting for an hour. → ✓", "He made me to laugh. → ✗ made me laugh", "I wish I had studied harder. → ✓", "The informations are on the website. → ✗ The information is", "You mustn't have seen him – he was in Rome. → ✗ You can't have seen him", "Despite of the rain, we went out. → ✗ Despite the rain", "I look forward to hearing from you. → ✓"]]
    ],
    "Speed chat": [
      ["Questions", ["What's the best thing you bought this year?", "What would you do with a free day tomorrow?", "What's your favourite place in Sicily?", "What did you want to be as a child?", "What's the best film you've seen recently?", "What's your perfect breakfast?", "Who's the funniest person you know?", "What's something you can't live without?", "Where would you like to travel next?", "What's the best advice you've received?", "What do you do to relax?", "What's a skill you'd like to learn?"]]
    ],
    "Stand up if you've ever…": [
      ["Prompts (follow-up: 'When…?')", ["…been on TV", "…eaten snails", "…met a famous person", "…lost your phone", "…slept in a tent", "…been to another continent", "…broken something expensive", "…cried at a film", "…won a prize", "…been on a boat", "…cooked a whole meal", "…fallen asleep on a bus"]]
    ],
    "Taboo": [
      ["Everyday cards", ["wallet|money,pocket,cards", "umbrella|rain,wet,open", "breakfast|morning,eat,coffee", "airport|plane,fly,passport", "fridge|cold,kitchen,food", "teacher|school,class,students", "birthday|cake,party,age", "beach|sea,sand,summer", "doctor|ill,hospital,medicine", "holiday|travel,work,summer"]],
      ["B1–B2 cards", ["embarrassed|red,shy,face", "receipt|pay,shop,paper", "neighbour|house,next,live", "traffic jam|cars,road,stuck", "interview|job,questions,company", "jealous|envy,want,partner", "deadline|date,finish,work", "landlord|rent,house,flat", "bargain|cheap,price,buy", "hangover|drink,head,morning"]]
    ],
    "Twenty questions": [
      ["Secret cards", ["a giraffe", "the Colosseum", "a pizza", "Cristiano Ronaldo", "a toothbrush", "the Moon", "a bicycle", "Mount Etna", "a mobile phone", "a cannolo", "Harry Potter", "the Eiffel Tower"]],
      ["Good first questions", ["Is it alive?", "Is it a person?", "Can you eat it?", "Is it bigger than a car?", "Is it in Italy?", "Can you hold it in your hand?"]]
    ],
    "Two truths and a lie": [
      ["Model (teacher first)", ["I've been to Japan.", "I can play the trumpet.", "I once met the Pope."]],
      ["Sentence starters", ["I've been to…", "I can…", "When I was a child, I…", "I've never…", "I once met…", "I'm afraid of…"]]
    ],
    "Unfinished sentences": [
      ["Conditionals / wish", ["If I won the lottery…", "If I could live anywhere…", "If I were the mayor of Bagheria…", "I wish I could…", "If I had more time…", "If I hadn't come to class today…"]],
      ["Everyday", ["The best thing about weekends is…", "I'm really bad at…", "I've never understood why…", "When I was a child, I always…", "Tomorrow I'm going to…", "The last time I laughed a lot was…"]]
    ],
    "Vote with your feet": [
      ["Grammar: true or false?", ["In English we say 'I'm agree'. → false (I agree)", "'People' is plural. → true", "We say 'I've been here for two years'. → true", "'Informations' is correct. → false (information)", "The past of 'buy' is 'buyed'. → false (bought)", "We use 'since' with a point in time: since 2019. → true", "'Can' needs 'to': I can to swim. → false", "We say 'make homework'. → false (do homework)"]],
      ["Fun facts: true or false?", ["Sicily is the biggest island in the Mediterranean. → true", "London is older than Palermo. → false", "Octopuses have three hearts. → true", "A tomato is a fruit. → true", "Big Ben is the name of the clock tower. → false (it's the bell)"]]
    ],
    "Whisper challenge": [
      ["Sentences", ["She sells sea shells on the sea shore.", "Three thin thieves thought a thousand thoughts.", "Red lorry, yellow lorry.", "I saw a kitten eating chicken in the kitchen.", "Peter's pizza is better than Betty's pasta.", "The sixth sick sheikh's sixth sheep's sick.", "Which witch wished which wicked wish?", "We went to Wales on Wednesday."]]
    ],
    "Would you rather…?": [
      ["Questions", ["Would you rather live without your phone or without coffee?", "Would you rather be able to fly or be invisible?", "Would you rather live in London or New York?", "Would you rather never eat pasta again or never eat pizza again?", "Would you rather always be too hot or always be too cold?", "Would you rather be famous or rich?", "Would you rather speak all languages or play every instrument?", "Would you rather have a cat or a dog?", "Would you rather go to the beach or the mountains?", "Would you rather read the book or watch the film?", "Would you rather work at night or start at 5 a.m.?", "Would you rather lose your keys or your wallet?"]]
    ],
    "eXpert minute": [
      ["Topic ideas", ["How to make the perfect arancina", "How to survive a Monday", "The rules of a sport you play", "How to look after a pet", "Your favourite app and how to use it", "How to cook pasta properly", "The best places in Bagheria", "How to save money", "How to be a good guest", "A game you love", "How to take a good photo", "How to plan a holiday"]]
    ],
    "Yes / No game": [
      ["Tricky questions", ["Do you like pizza?", "Are you Italian?", "Is today Monday?", "Did you come by car?", "Have you got a pet?", "Is that your bag?", "Are you sure?", "Can you swim?", "Is it raining?", "Do you understand?", "Is my name Mario?", "So that's a yes?", "Are you nervous?", "Did you just say yes?", "Are you ready for another question?"]],
      ["Ways to answer (on the board)", ["Of course!", "Not really.", "I do. / I don't.", "Absolutely!", "Certainly not!", "I think so. / I don't think so.", "Correct."]]
    ],
    "Zoom in": [
      ["Things that work well zoomed in (phone photos)", ["a pineapple", "a bicycle wheel", "a cat's eye", "a zip", "a cheese grater", "a strawberry", "a keyboard", "a tennis ball", "a spider's web", "an orange peel"]],
      ["Language", ["It might be a… / It could be a…", "It can't be a… because…", "It must be a…", "It looks like a…"]]
    ],

    /* ---------------- KIDS ---------------- */
    "Animal charades": [
      ["Animal cards", ["monkey", "elephant", "snake", "frog", "lion", "bird", "fish", "rabbit", "kangaroo", "penguin", "horse", "crocodile"]],
      ["Questions for the class", ["Can it fly?", "Can it swim?", "Is it big?", "Has it got a long tail?", "You're a…!"]]
    ],
    "Ball questions": [
      ["Easy questions", ["What's your name?", "How old are you?", "What's your favourite colour?", "What's your favourite food?", "Have you got a pet?", "What's your favourite animal?", "Where do you live?", "Have you got a brother or sister?", "What's your favourite toy?", "Can you swim?", "Do you like ice cream?", "What colour is your bag?"]]
    ],
    "Bingo": [
      ["Numbers 1–20 (children choose 9)", ["one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten", "eleven", "twelve", "thirteen", "fourteen", "fifteen", "sixteen", "seventeen", "eighteen", "nineteen", "twenty"]],
      ["Colours", ["red", "blue", "green", "yellow", "orange", "purple", "pink", "black", "white", "brown", "grey", "gold"]],
      ["Animals", ["cat", "dog", "fish", "bird", "horse", "cow", "sheep", "duck", "lion", "monkey", "elephant", "snake", "frog", "rabbit"]],
      ["Food", ["apple", "banana", "bread", "cheese", "pizza", "egg", "milk", "chicken", "rice", "carrot", "orange", "cake", "ice cream", "water"]],
      ["School things", ["pen", "pencil", "rubber", "ruler", "book", "bag", "desk", "chair", "board", "crayon", "pencil case", "notebook", "scissors", "glue"]],
      ["Clothes", ["T-shirt", "jeans", "dress", "skirt", "shoes", "socks", "hat", "jacket", "jumper", "shorts", "boots", "trousers"]],
      ["Body", ["head", "eyes", "ears", "nose", "mouth", "hair", "hand", "arm", "leg", "foot", "fingers", "teeth"]]
    ],
    "Colour touch": [
      ["Commands (get faster!)", ["Touch something blue!", "Touch something red!", "Touch something green and say what it is!", "Touch a chair!", "Touch the door!", "Touch your nose!", "Touch something yellow!", "Touch something white!", "Touch a window!", "Touch something black – walking backwards!"]]
    ],
    "Draw and guess": [
      ["Easy-to-draw words", ["cat", "sun", "house", "car", "tree", "fish", "flower", "ball", "apple", "boat", "snake", "pizza", "hat", "moon", "spider"]]
    ],
    "Echo chant": [
      ["Voices", ["whisper", "robot", "giant", "mouse (squeaky)", "sad", "happy", "very slow", "very fast", "opera singer", "monster"]],
      ["Chunks to chant", ["Hello! How are you?", "What's your name?", "I like pizza!", "Banana, banana, BANANA!", "Can I have a pencil, please?", "It's my birthday!", "One, two, three – look at me!", "See you later, alligator!"]]
    ],
    "Flashcard slap": [
      ["Animals", ["cat", "dog", "lion", "giraffe", "monkey", "fish", "bird", "horse"]],
      ["Food", ["apple", "banana", "pizza", "cake", "milk", "egg", "bread", "carrot"]],
      ["Clothes", ["hat", "T-shirt", "shoes", "dress", "socks", "jacket", "jeans", "skirt"]],
      ["Family", ["mum", "dad", "brother", "sister", "grandma", "grandpa", "baby", "cousin"]],
      ["Weather", ["sunny", "rainy", "windy", "cloudy", "snowy", "hot", "cold", "stormy"]]
    ],
    "Fly swatter": [
      ["Clue → word (write the words on the board)", ["It's yellow and you can eat it. → banana", "It's big and grey and it has a long nose. → elephant", "You write with it. → pencil", "It's in the sky at night. → moon", "You wear it on your head. → hat", "It says 'moo'. → cow", "You sit on it. → chair", "It's cold and sweet. → ice cream", "It lives in water. → fish", "It's orange and rabbits love it. → carrot"]]
    ],
    "Feely bag": [
      ["Objects to put in the bag", ["pencil", "rubber", "ball", "spoon", "key", "toy car", "sock", "apple", "coin", "teddy bear"]],
      ["Describing words", ["It's big / small.", "It's soft / hard.", "It's round / long.", "It's smooth / bumpy.", "Is it a…?"]]
    ],
    "Hot potato": [
      ["Topics (no repeats!)", ["food", "animals", "colours", "clothes", "numbers", "body", "toys", "things in the classroom", "family", "sports"]]
    ],
    "I spy": [
      ["Colours (little ones)", ["I spy something blue.", "I spy something red.", "I spy something green.", "I spy something yellow.", "I spy something white."]],
      ["Letters (older children)", ["…something beginning with B (book, board, bag)", "…with C (chair, clock, crayon)", "…with D (door, desk)", "…with P (pen, pencil, picture)", "…with W (window, wall)", "…with T (table, teacher)"]]
    ],
    "Jump the line": [
      ["Sentences (true / false)", ["A cat has got wings. → false", "Bananas are yellow. → true", "Fish can swim. → true", "A cow says 'woof'. → false", "Snow is hot. → false", "We have got two eyes. → true", "An elephant is small. → false", "Birds can fly. → true", "Pizza is a drink. → false", "There are seven days in a week. → true"]]
    ],
    "Kim's game (kids)": [
      ["Sets of 6", ["cat · dog · fish · bird · horse · duck", "apple · banana · pear · orange · lemon · grapes", "pen · pencil · rubber · ruler · book · bag", "hat · shoes · socks · dress · T-shirt · jacket", "red · blue · green · yellow · pink · black"]]
    ],
    "Line up!": [
      ["Line up by…", ["age – 'How old are you?' 'I'm eight!'", "the first letter of your name – 'What's your name?'", "birthday month – 'When's your birthday?'", "shoe size – 'What size are your shoes?'", "height – 'You're taller than me!'", "favourite number – 'What's your favourite number?'"]]
    ],
    "Memory pairs": [
      ["Opposites (word + word)", ["big – small", "hot – cold", "happy – sad", "fast – slow", "up – down", "old – young", "open – closed", "day – night"]],
      ["Rhyming pairs", ["cat – hat", "dog – frog", "bee – tree", "car – star", "mouse – house", "cake – snake", "fish – dish", "boat – coat"]]
    ],
    "Musical words": [
      ["Words for the chairs", ["elephant", "pizza", "red", "teacher", "ball", "sun", "chair", "banana", "dog", "rain", "milk", "book"]],
      ["Bonus sentence frames", ["The… is big / small.", "I like…", "I've got a…", "My favourite… is…"]]
    ],
    "Noughts and crosses": [
      ["Grid 1 – vocabulary (one per square)", ["cat → make a sentence: I've got a cat.", "red → What's red?", "apple → spell it!", "dog → What can a dog do?", "sun → What colour is it?", "ball → Where's the ball?", "fish → Can a fish fly?", "hat → Where do you wear it?", "milk → What colour is it?"]],
      ["Grid 2 – questions", ["How old are you?", "What's your favourite colour?", "Count to 15!", "Name 3 animals.", "Spell your name.", "What's the weather like?", "Name 3 colours.", "What day is it today?", "Name 3 foods you like."]]
    ],
    "Odd one out (kids)": [
      ["Groups", ["apple · banana · dog · pear → dog", "red · blue · cat · green → cat", "hat · shoes · socks · pizza → pizza", "one · two · tree · three → tree", "cow · horse · sheep · car → car", "pen · pencil · rubber · cake → cake", "mum · dad · sister · teacher → teacher", "sunny · rainy · windy · happy → happy"]]
    ],
    "Pass the ball and spell": [
      ["3 letters", ["cat", "dog", "red", "sun", "hat", "pen", "bag", "cup"]],
      ["4–5 letters", ["fish", "book", "blue", "frog", "apple", "green", "horse", "pizza"]],
      ["Challenge", ["banana", "yellow", "rabbit", "monkey", "school", "orange", "purple", "pencil"]]
    ],
    "Quiet ball": [
      ["Questions for the board", ["What's your favourite colour?", "What's your favourite animal?", "How old are you?", "What did you eat for breakfast?", "Have you got a pet?", "What's your favourite food?", "Can you ride a bike?", "What's the weather like today?"]]
    ],
    "Run and touch": [
      ["Commands", ["Run to the lion!", "Run to something you can eat!", "Run to something that can fly!", "Run to something yellow!", "Run to an animal with a long tail!", "Run to something cold!", "Run to the biggest animal!", "Hop to the fish!"]]
    ],
    "Rhyme time": [
      ["Words → rhymes", ["cat → hat, bat, mat, rat, sat", "dog → frog, log, fog, jog", "bee → tree, three, sea, me", "red → bed, head, bread, Ted", "cake → snake, lake, make, bake", "boat → coat, goat, note", "star → car, far, jar", "ball → wall, tall, small, fall"]]
    ],
    "Simon says": [
      ["Commands", ["Simon says touch your nose!", "Simon says jump three times!", "Simon says clap your hands!", "Touch your ears! (no Simon – don't move!)", "Simon says turn around!", "Simon says stand on one leg!", "Sit down! (no Simon!)", "Simon says hop like a rabbit!", "Simon says touch your toes!", "Simon says wave your arms!", "Wave! (no Simon!)", "Simon says say 'hello' to your friend!"]]
    ],
    "Spin the pen": [
      ["Questions", ["How many brothers and sisters have you got?", "What's your favourite food?", "What colour are your eyes?", "Have you got a pet? What's its name?", "What's your favourite sport?", "What can you see in the window?", "What did you do yesterday?", "Can you sing a song?", "What's your favourite season?", "What's your mum's name?"]]
    ],
    "Stop! (kids categories)": [
      ["Categories", ["animal · food · colour", "toy · clothes · body", "sport · family · number"]],
      ["Good letters + model answers", ["P → pig · pizza · pink", "B → bird · banana · blue", "Y → yak · yoghurt · yellow", "G → giraffe · grapes · green", "R → rabbit · rice · red", "S → snake · sandwich · silver"]]
    ],
    "Traffic lights": [
      ["Sentences", ["Fish can swim! → green (true)", "Cats can fly! → red (false)", "Ice cream is cold! → green", "There are 10 days in a week! → red", "Elephants are small! → red", "Bananas are yellow! → green", "A spider has got eight legs! → green", "It's sunny today! → (look outside!)", "Our teacher is 100 years old! → red… or yellow?", "Pizza is from Italy! → green"]]
    ],
    "Under the cup": [
      ["Questions and answers", ["Where's the mouse? – It's under the red cup.", "Is it under the blue cup? – No, it isn't.", "Is it in the box? – Yes, it is!", "Where's the ball? – It's on the table.", "Where's the cat? – It's next to the book.", "Where's the pencil? – It's in the bag."]]
    ],
    "What's missing? (board)": [
      ["Sets of 8 (draw or write)", ["sun · moon · star · tree · house · car · ball · fish", "apple · banana · orange · cake · pizza · egg · milk · bread", "cat · dog · bird · cow · lion · duck · frog · pig", "hat · shoes · socks · dress · T-shirt · jeans · jumper · coat"]]
    ],
    "What's the time, Mr Wolf?": [
      ["Script", ["Children: 'What's the time, Mr Wolf?'", "Wolf: 'It's three o'clock!' → 3 steps (count them aloud)", "Children: 'What's the time, Mr Wolf?'", "Wolf: 'It's seven o'clock!' → 7 steps", "Wolf: 'It's half past two!' → 2 big steps + 1 small step", "Wolf: 'DINNER TIME!' → everyone runs back!"]]
    ],
    "X-ray eyes": [
      ["Flashcard words", ["dog", "cat", "tiger", "car", "apple", "ball", "house", "fish", "teddy bear", "banana", "bike", "pizza"]]
    ],
    "Yes / no corners": [
      ["Questions → short answers", ["Have you got a dog? → Yes, I have. / No, I haven't.", "Do you like pizza? → Yes, I do. / No, I don't.", "Can you swim? → Yes, I can. / No, I can't.", "Are you eight? → Yes, I am. / No, I'm not.", "Have you got a sister? → Yes, I have. / No, I haven't.", "Do you like spiders? → Yes, I do. / No, I don't.", "Can you ride a bike? → Yes, I can. / No, I can't.", "Is it sunny today? → Yes, it is. / No, it isn't."]]
    ],
    "Zombie freeze": [
      ["Actions to shout", ["Jump!", "Swim!", "Dance!", "Run on the spot!", "Fly like a bird!", "Hop!", "Clap!", "Climb!", "Sleep!", "Eat spaghetti!", "Play football!", "Brush your teeth!"]]
    ]
  };

  function attach() {
    const A = window.LLS_ACTIVITIES;
    if (!A) return;
    [...A.ADULTS, ...A.KIDS].forEach((g) => { if (K[g.n]) g.kit = K[g.n]; });
  }
  // One kit item → { t: text, a: hidden answer, ban: [banned words] }
  function parseItem(s) {
    s = String(s);
    let a = "", ban = [];
    const ar = s.indexOf(" → ");
    if (ar > -1) { a = s.slice(ar + 3).trim(); s = s.slice(0, ar).trim(); }
    const bar = s.indexOf("|");
    if (bar > -1) { ban = s.slice(bar + 1).split(",").map((x) => x.trim()).filter(Boolean); s = s.slice(0, bar).trim(); }
    return { t: s, a, ban };
  }
  // Teacher view (A–Z directory + lesson suggestions): answers blurred until tapped.
  function kitHtml(g, esc) {
    if (!g || !g.kit || !g.kit.length) return "";
    const n = g.kit.reduce((s, k) => s + k[1].length, 0);
    return `<details class="act-kit"><summary>📋 <b>Ready to use</b> – ${n} items, nothing to prepare</summary>${g.kit.map(([t, items]) => `<div class="kit-set"><div class="kit-t">${esc(t)}</div><ul>${items.map((s) => { const it = parseItem(s); return `<li>${esc(it.t)}${it.ban.length ? ` <span class="kit-ban">🚫 ${it.ban.map(esc).join(" · ")}</span>` : ""}${it.a ? ` <button type="button" class="kit-a" title="Tap to show the answer">${esc(it.a)}</button>` : ""}</li>`; }).join("")}</ul></div>`).join("")}</details>`;
  }
  document.addEventListener("click", (e) => { const b = e.target.closest && e.target.closest(".kit-a"); if (b) { e.preventDefault(); b.classList.toggle("on"); } });
  attach();
  window.LLS_ACT_KITS = { K, parseItem, kitHtml, attach };
})();
