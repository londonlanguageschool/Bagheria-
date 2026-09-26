/* London Language School: course books used for the Practice section.
   Lesson codes, titles and grammar/vocabulary topics come from the
   books' contents pages (English File 4th edition, OUP). The practice
   exercises in practice/*.json are original LLS material written to
   match each lesson's topics; no book content is reproduced. */
(function (root) {
  "use strict";

  function L(code, title, grammar, vocab) {
    return { code: code, title: title, grammar: grammar, vocab: vocab };
  }

  const COURSES = {
    "EF-A1": {
      title: "English File A1 (Beginner)",
      level: "A1",
      bank: "practice/EF-A1.json",
      lessons: [
        L("1A", "A cappuccino, please", "verb be (singular): I and you", "numbers 0–10, days of the week, saying goodbye"),
        L("1B", "World music", "verb be (singular): he, she, it", "countries"),
        L("2A", "Are you on holiday?", "verb be (plural): we, you, they", "nationalities"),
        L("2B", "That's my bus!", "Wh- and How questions with be", "phone numbers, numbers 11–100"),
        L("3A", "Where are my keys?", "singular and plural nouns, a / an", "small things"),
        L("3B", "Souvenirs", "this / that / these / those", "souvenirs"),
        L("4A", "Meet the family", "possessive adjectives, possessive 's", "people and family"),
        L("4B", "The perfect car", "adjectives", "colours and common adjectives"),
        L("5A", "A big breakfast?", "present simple + and −: I, you, we, they", "food and drink"),
        L("5B", "A very long flight", "present simple questions: I, you, we, they", "common verb phrases 1"),
        L("6A", "A school reunion", "present simple: he, she, it", "jobs and places of work"),
        L("6B", "Good morning, goodnight", "adverbs of frequency", "a typical day"),
        L("7A", "Have a nice weekend!", "word order in questions: be and present simple", "common verb phrases 2: free time"),
        L("7B", "Lights, camera, action!", "imperatives, object pronouns: me, him, etc.", "kinds of films"),
        L("8A", "Can I park here?", "can / can't", "more verb phrases"),
        L("8B", "I love cooking", "like / love / hate + verb + -ing", "activities"),
        L("9A", "Everything's fine!", "present continuous", "common verb phrases 2: travelling"),
        L("9B", "Working undercover", "present continuous or present simple?", "clothes"),
        L("10A", "A room with a view", "there's a… / there are some…", "hotels, in, on, under"),
        L("10B", "Where were you?", "past simple: be", "in, on, at"),
        L("11A", "A new life in the USA", "past simple: regular verbs", "regular verbs"),
        L("11B", "How was your day?", "past simple irregular verbs: get, go, have, do", "verb phrases with get, go, have, do"),
        L("12A", "Strangers on a train", "past simple: regular and irregular verbs", "regular and irregular verbs"),
        L("12B", "Revise the past", "past simple revision", "revision of past verb forms")
      ]
    },

    "EF-A1A2": {
      title: "English File A1/A2 (Elementary)",
      level: "A1/A2",
      bank: "practice/EF-A1A2.json",
      lessons: [
        L("1A", "Welcome to the class", "verb be +, subject pronouns: I, you, etc.", "days of the week, numbers 0–20"),
        L("1B", "One world", "verb be − and ?", "countries, numbers 21–100"),
        L("1C", "What's your email?", "possessive adjectives: my, your, etc.", "classroom language"),
        L("2A", "Are you tidy or untidy?", "singular and plural nouns", "things, in, on, under"),
        L("2B", "Made in America", "adjectives", "colours, adjectives, modifiers: very / really, quite"),
        L("2C", "Slow down!", "imperatives, let's", "feelings"),
        L("3A", "Britain: the good and the bad", "present simple + and −", "verb phrases: cook dinner, etc."),
        L("3B", "9 to 5", "present simple ?", "jobs"),
        L("3C", "Love me, love my dog", "word order in questions", "question words"),
        L("4A", "Family photos", "possessive 's, Whose…?", "family"),
        L("4B", "From morning to night", "prepositions of time (at, in, on) and place (at, in, to)", "daily routine"),
        L("4C", "Blue Zones", "position of adverbs, expressions of frequency", "months, adverbs and expressions of frequency"),
        L("5A", "Vote for me!", "can / can't", "verb phrases: buy a newspaper, etc."),
        L("5B", "A quiet life?", "present continuous: be + verb + -ing", "noise: verbs and verb phrases"),
        L("5C", "A city for all seasons", "present simple or present continuous?", "the weather and seasons"),
        L("6A", "A North African story", "object pronouns: me, you, him, etc.", "words in a story"),
        L("6B", "The third Friday in June", "like + (verb + -ing)", "the date, ordinal numbers"),
        L("6C", "Making music", "revision: be or do?", "music"),
        L("7A", "Selfies", "past simple of be: was / were", "word formation: write → writer"),
        L("7B", "Wrong name, wrong place", "past simple: regular verbs", "past time expressions"),
        L("7C", "Happy New Year?", "past simple: irregular verbs", "go, have, get"),
        L("8A", "A murder mystery", "past simple: regular and irregular", "irregular verbs"),
        L("8B", "A house with a history", "there is / there are, some / any + plural nouns", "the house"),
        L("8C", "Room 333", "there was / there were", "prepositions: place and movement"),
        L("9A", "#mydinnerlastnight", "countable / uncountable nouns, a / an, some / any", "food and drink"),
        L("9B", "White gold", "quantifiers: how much / how many, a lot of, etc.", "food containers"),
        L("9C", "Facts and figures", "comparative adjectives", "high numbers"),
        L("10A", "The most dangerous place…", "superlative adjectives", "places and buildings"),
        L("10B", "Five continents in a day", "be going to (plans), future time expressions", "city holidays"),
        L("10C", "The fortune teller", "be going to (predictions)", "verb phrases"),
        L("11A", "Culture shock", "adverbs (manner and modifiers)", "common adverbs"),
        L("11B", "Experiences or things?", "verb + to + infinitive", "verbs that take the infinitive"),
        L("11C", "How smart is your phone?", "definite article: the or no the", "phones and the internet"),
        L("12A", "I've seen it ten times!", "present perfect", "irregular past participles"),
        L("12B", "He's been everywhere!", "present perfect or past simple?", "learning irregular verbs"),
        L("12C", "The English File interview", "revision: question formation", "question words and everyday questions")
      ]
    },

    "EF-A2B1": {
      title: "English File A2/B1 (Pre-intermediate)",
      level: "A2/B1",
      bank: "practice/EF-A2B1.json",
      lessons: [
        L("1A", "Are you? Can you? Do you? Did you?", "word order in questions", "common verb phrases"),
        L("1B", "The perfect date?", "present simple", "describing people: appearance and personality"),
        L("1C", "The Remake Project", "present continuous", "clothes, prepositions of place"),
        L("2A", "OMG! Where's my passport?", "past simple: regular and irregular verbs", "holidays"),
        L("2B", "That's me in the picture!", "past continuous", "prepositions of time and place: at, in, on"),
        L("2C", "One dark October evening", "time sequencers and connectors", "verb phrases"),
        L("3A", "TripAside", "be going to (plans and predictions)", "airports"),
        L("3B", "Put it in your calendar!", "present continuous (future arrangements)", "verbs + prepositions, e.g. arrive in"),
        L("3C", "Word games", "defining relative clauses", "paraphrasing"),
        L("4A", "Who does what?", "present perfect + yet, just, already", "housework, make or do?"),
        L("4B", "In your basket", "present perfect or past simple? (1)", "shopping"),
        L("4C", "#greatweekend", "something, anything, nothing, etc.", "adjectives ending -ed and -ing"),
        L("5A", "I want it NOW!", "comparative adjectives and adverbs, as…as", "types of numbers"),
        L("5B", "Twelve lost wallets", "superlatives (+ ever + present perfect)", "describing a town or city"),
        L("5C", "How much is enough?", "quantifiers, too, (not) enough", "health and the body"),
        L("6A", "Think positive – or negative?", "will / won't (predictions)", "opposite verbs"),
        L("6B", "I'll always love you", "will / won't / shall (other uses)", "verb + back"),
        L("6C", "The meaning of dreaming", "review of verb forms: present, past, and future", "modifiers"),
        L("7A", "First day nerves", "uses of the infinitive with to", "verbs + infinitive: try to, forget to, etc."),
        L("7B", "Happiness is…", "uses of the gerund (verb + -ing)", "verbs + gerund"),
        L("7C", "Could you pass the test?", "have to, don't have to, must, mustn't", "adjectives + prepositions: afraid of, etc."),
        L("8A", "Should I stay or should I go?", "should", "get"),
        L("8B", "Murphy's Law", "if + present, will + infinitive (first conditional)", "confusing verbs"),
        L("8C", "Who is Vivienne?", "possessive pronouns", "adverbs of manner"),
        L("9A", "Beware of the dog", "if + past, would + infinitive (second conditional)", "animals and insects"),
        L("9B", "Fearof.net", "present perfect + for and since", "words related to fear, phrases with for and since"),
        L("9C", "Scream queens", "present perfect or past simple? (2)", "biographies"),
        L("10A", "Into the net", "expressing movement", "sports, expressing movement"),
        L("10B", "Early birds", "word order of phrasal verbs", "phrasal verbs"),
        L("10C", "International inventions", "the passive", "people from different countries"),
        L("11A", "Ask the teacher", "used to", "school subjects"),
        L("11B", "Help! I can't decide!", "might", "word building: noun formation"),
        L("11C", "Twinstrangers.net", "so, neither + auxiliaries", "similarities and differences"),
        L("12A", "Unbelievable!", "past perfect", "time expressions"),
        L("12B", "Think before you speak", "reported speech", "say or tell?"),
        L("12C", "The English File quiz", "questions without auxiliaries", "revision of question words")
      ]
    },

    "EF-B1": {
      title: "English File B1/B1+ (Intermediate)",
      level: "B1/B1+",
      bank: "practice/EF-B1.json",
      lessons: [
        L("1A", "Eating in…and out", "present simple and continuous, action and non-action verbs", "food and cooking"),
        L("1B", "Modern families", "future forms: present continuous, be going to, will / won't", "family, adjectives of personality"),
        L("2A", "Spending money", "present perfect and past simple", "money"),
        L("2B", "Changing lives", "present perfect + for / since, present perfect continuous", "strong adjectives: exhausted, amazed, etc."),
        L("3A", "Survive the drive", "choosing between comparatives and superlatives", "transport"),
        L("3B", "Men, women, and children", "articles: a / an, the, no article", "collocation: verbs / adjectives + prepositions"),
        L("4A", "Bad manners?", "obligation and prohibition: have to, must, should", "phone language"),
        L("4B", "Yes, I can!", "ability and possibility: can, could, be able to", "-ed / -ing adjectives"),
        L("5A", "Sporting superstitions", "past tenses: simple, continuous, perfect", "sport"),
        L("5B", "#thewaywemet", "past and present habits and states", "relationships"),
        L("6A", "Behind the scenes", "passive (all tenses)", "cinema"),
        L("6B", "Every picture tells a story", "modals of deduction: might, can't, must", "the body"),
        L("7A", "Live and learn", "first conditional and future time clauses + when, until, etc.", "education"),
        L("7B", "The hotel of Mum and Dad", "second conditional, choosing between conditionals", "houses"),
        L("8A", "The right job for you", "choosing between gerunds and infinitives", "work"),
        L("8B", "Have a nice day!", "reported speech: sentences and questions", "shopping, making nouns from verbs"),
        L("9A", "Lucky encounters", "third conditional", "making adjectives and adverbs"),
        L("9B", "Digital detox", "quantifiers", "electronic devices"),
        L("10A", "Idols and icons", "relative clauses: defining and non-defining", "compound nouns"),
        L("10B", "And the murderer is…", "question tags", "crime")
      ]
    },

    "EF-B2": {
      title: "English File B2 (Upper-intermediate)",
      level: "B2",
      bank: "practice/EF-B2.json",
      lessons: [
        L("1A", "Questions and answers", "question formation", "working out meaning from context"),
        L("1B", "It's a mystery", "auxiliary verbs, the…, the… + comparatives", "compound adjectives, modifiers"),
        L("2A", "Doctor, doctor!", "present perfect simple and continuous", "illnesses and injuries"),
        L("2B", "Act your age", "using adjectives as nouns, adjective order", "clothes and fashion"),
        L("3A", "Fasten your seat belts", "narrative tenses, past perfect continuous, so / such…that", "air travel"),
        L("3B", "A really good ending?", "the position of adverbs and adverbial phrases", "adverbs and adverbial phrases"),
        L("4A", "Stormy weather", "future perfect and future continuous", "the environment, weather"),
        L("4B", "A risky business", "zero and first conditionals, future time clauses", "expressions with take"),
        L("5A", "I'm a survivor", "unreal conditionals", "feelings"),
        L("5B", "Wish you were here", "wish for present / future, wish for past regrets", "expressing feelings with verbs or -ed / -ing adjectives"),
        L("6A", "Night night", "used to, be used to, get used to", "sleep"),
        L("6B", "Music to my ears", "gerunds and infinitives", "music"),
        L("7A", "Let's not argue", "past modals: must have, etc., would rather", "verbs often confused"),
        L("7B", "It's all an act", "verbs of the senses", "the body"),
        L("8A", "Cutting crime", "the passive (all forms), have something done, it is said that…, he is thought to…", "crime and punishment"),
        L("8B", "Fake news", "reporting verbs", "the media"),
        L("9A", "Good business?", "clauses of contrast and purpose", "advertising, business"),
        L("9B", "Super cities", "uncountable and plural nouns", "word building: prefixes and suffixes"),
        L("10A", "Science fact, science fiction", "quantifiers: all, every, both, etc.", "science"),
        L("10B", "Free speech", "articles", "collocation: word pairs")
      ]
    },

    "EF-C1": {
      title: "English File C1 (Advanced)",
      level: "C1",
      bank: "practice/EF-C1.json",
      lessons: [
        L("1A", "We are family", "have: lexical and grammatical uses", "personality"),
        L("1B", "A job for life?", "discourse markers (1): linkers", "work"),
        L("2A", "Do you remember…?", "the past: habitual events and specific incidents", "word building: abstract nouns"),
        L("2B", "On the tip of my tongue", "pronouns", "lexical areas"),
        L("3A", "A love-hate relationship", "get", "phrases with get"),
        L("3B", "Dramatic licence", "discourse markers (2): adverbs and adverbial expressions", "conflict and warfare"),
        L("4A", "An open book", "adding emphasis (1): inversion", "describing books and films"),
        L("4B", "The sound of silence", "speculation and deduction", "sounds and the human voice"),
        L("5A", "No time for anything", "distancing", "expressions with time"),
        L("5B", "Not for profit?", "unreal uses of past tenses", "money"),
        L("6A", "Help, I need somebody!", "verb + object + infinitive or gerund", "compound adjectives"),
        L("6B", "Can't give it up", "conditional sentences", "phones and technology, adjectives + prepositions"),
        L("7A", "As a matter of fact…", "permission, obligation, and necessity", "word formation: prefixes"),
        L("7B", "A masterpiece?", "perception and sensation", "art, colour idioms"),
        L("8A", "The best medicine?", "advanced gerunds and infinitives", "health and medicine, similes"),
        L("8B", "A 'must-see' attraction", "expressing future plans and arrangements", "travel and tourism"),
        L("9A", "Pet hates", "ellipsis", "animal matters"),
        L("9B", "How to cook, how to eat", "nouns: compound and possessive forms", "preparing food"),
        L("10A", "On your marks, set, go!", "relative clauses", "word building: adjectives, nouns, and verbs"),
        L("10B", "No direction home", "adding emphasis (2): cleft sentences", "words that are often confused")
      ]
    }
  };

  // Unit number from a lesson code ("10A" -> 10).
  Object.keys(COURSES).forEach(function (id) {
    COURSES[id].id = id;
    COURSES[id].lessons.forEach(function (lesson) {
      lesson.unit = parseInt(lesson.code, 10);
      lesson.id = id + "-" + lesson.code;
    });
    COURSES[id].unitCount = COURSES[id].lessons.reduce(function (max, l) {
      return Math.max(max, l.unit);
    }, 0);
  });

  // Every lesson has three practice sets: grammar, vocabulary, speaking.
  const SET_TYPES = ["g", "v", "s"];

  // Progress: homework counts 80%, practice 20%. Practice only counts
  // the class's own units (e.g. B1 year 1 = units 1-5) up to the unit the
  // class has reached, so a student who keeps up can reach 100%.
  // unitsText: "" (whole book) or "1-5" / "6-10". currentUnit: number or "".
  function parseUnits(courseId, unitsText) {
    const course = COURSES[courseId];
    const max = course ? course.unitCount : 0;
    const m = String(unitsText || "").match(/(\d+)\s*[-–to]+\s*(\d+)/);
    let from = 1, to = max;
    if (m) {
      from = Math.max(1, Math.min(max, Number(m[1])));
      to = Math.max(from, Math.min(max, Number(m[2])));
    }
    return { from: from, to: to };
  }

  function practiceSetIdsFor(courseId, unitsText, currentUnit) {
    const course = COURSES[courseId];
    if (!course) return [];
    const range = parseUnits(courseId, unitsText);
    const cur = Number(currentUnit);
    const limit = cur >= range.from ? Math.min(cur, range.to) : range.to;
    const ids = [];
    course.lessons.forEach(function (lesson) {
      if (lesson.unit >= range.from && lesson.unit <= limit) {
        SET_TYPES.forEach(function (t) { ids.push(lesson.id + "-" + t); });
      }
    });
    return ids;
  }

  function combinedProgress(homeworkDone, homeworkTotal, practiceDone, practiceTotal) {
    const hw = homeworkTotal > 0 ? homeworkDone / homeworkTotal : null;
    const pr = practiceTotal > 0 ? Math.min(1, practiceDone / practiceTotal) : null;
    let value = 0;
    if (hw !== null && pr !== null) value = 0.8 * hw + 0.2 * pr;
    else if (hw !== null) value = hw;
    else if (pr !== null) value = pr;
    return Math.round(value * 100);
  }

  root.LLS_COURSES = COURSES;
  root.LLS_PRACTICE = {
    SET_TYPES: SET_TYPES,
    PASS_MARK: 0.5,
    parseUnits: parseUnits,
    practiceSetIdsFor: practiceSetIdsFor,
    combinedProgress: combinedProgress
  };
})(typeof window !== "undefined" ? window : globalThis);
