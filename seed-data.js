"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var axios_1 = __importDefault(require("axios"));
var API_URL = 'https://ismellbullshit.com/api';
var names = [
    'Karen Smith', 'Bob Johnson', 'Sarah Williams', 'Mike Davis',
    'Jennifer Brown', 'David Wilson', 'Lisa Garcia', 'Chris Martinez',
    'Emily Rodriguez', 'James Anderson', 'Mary Taylor', 'Robert Thomas'
];
var posts = [
    {
        title: 'Bullshit Alert',
        content: 'Just heard a politician say they "care about the working class" while voting to cut minimum wage. The audacity!',
        author: 'Karen Smith',
        email: 'karen@example.com',
        tags: ['politics', 'hypocrisy'],
        daysAgo: 38
    },
    {
        title: 'Bullshit Alert',
        content: 'My boss just told us "we\'re a family here" right before announcing no holiday bonuses this year. Sure, Jan.',
        author: 'Anonymous',
        email: 'anonymous@ismellbs.com',
        tags: ['corporate', 'workplace'],
        daysAgo: 35
    },
    {
        title: 'Bullshit Alert',
        content: 'Company email: "We value work-life balance!" Also company: Schedules mandatory meetings at 7 AM and 6 PM on the same day.',
        author: 'Bob Johnson',
        email: 'bob@example.com',
        tags: ['workplace', 'corporate'],
        daysAgo: 32
    },
    {
        title: 'Bullshit Alert',
        content: 'The weather forecast said "partly cloudy" and it\'s been pouring rain all day. I guess my umbrella is just for decoration.',
        author: 'Sarah Williams',
        email: 'sarah@example.com',
        tags: ['weather', 'everyday'],
        daysAgo: 30
    },
    {
        title: 'Bullshit Alert',
        content: 'Ad: "Lose 30 pounds in 2 weeks without diet or exercise!" Yeah, and I\'m the Queen of England. This is peak BS marketing.',
        author: 'Anonymous',
        email: 'anonymous@ismellbs.com',
        tags: ['advertising', 'scams'],
        daysAgo: 28
    },
    {
        title: 'Bullshit Alert',
        content: 'Politician promises to "drain the swamp" and then immediately hires three lobbyists. You can\'t make this stuff up!',
        author: 'Mike Davis',
        email: 'mike@example.com',
        tags: ['politics', 'corruption'],
        daysAgo: 25
    },
    {
        title: 'Bullshit Alert',
        content: 'Social media influencer: "Just woke up like this!" Posts professionally lit photo with full makeup and hair done. The lies!',
        author: 'Jennifer Brown',
        email: 'jennifer@example.com',
        tags: ['social-media', 'influencers'],
        daysAgo: 23
    },
    {
        title: 'Bullshit Alert',
        content: 'ISP customer service: "Your internet will be restored in 24-48 hours." Day 5 and still nothing. Classic.',
        author: 'Anonymous',
        email: 'anonymous@ismellbs.com',
        tags: ['customer-service', 'tech'],
        daysAgo: 20
    },
    {
        title: 'Bullshit Alert',
        content: 'News headline: "Millionaire says millennials should just stop buying coffee to afford homes." Meanwhile, houses cost 10x what they did when he bought his.',
        author: 'David Wilson',
        email: 'david@example.com',
        tags: ['economy', 'housing'],
        daysAgo: 18
    },
    {
        title: 'Bullshit Alert',
        content: 'Gym membership fine print is 3 pages long but canceling requires a blood oath and sacrifice of your firstborn. Total BS!',
        author: 'Lisa Garcia',
        email: 'lisa@example.com',
        tags: ['contracts', 'gym'],
        daysAgo: 15
    },
    {
        title: 'Bullshit Alert',
        content: 'Boss: "We don\'t have budget for raises this year." Also boss: Just bought a third vacation home. I smell BS.',
        author: 'Anonymous',
        email: 'anonymous@ismellbs.com',
        tags: ['workplace', 'inequality'],
        daysAgo: 13
    },
    {
        title: 'Bullshit Alert',
        content: 'Dating app profile: "I\'m 6 feet tall, successful entrepreneur, love hiking and travel." Reality: 5\'7", unemployed, Netflix on the couch. Why do people lie?!',
        author: 'Chris Martinez',
        email: 'chris@example.com',
        tags: ['dating', 'online'],
        daysAgo: 11
    },
    {
        title: 'Bullshit Alert',
        content: 'Product packaging: "New and Improved!" Checked the ingredients - literally the exact same formula. Marketing BS at its finest.',
        author: 'Emily Rodriguez',
        email: 'emily@example.com',
        tags: ['marketing', 'products'],
        daysAgo: 9
    },
    {
        title: 'Bullshit Alert',
        content: 'University: "We care about student mental health!" Also university: Assigns 5 major projects due the same week as finals.',
        author: 'Anonymous',
        email: 'anonymous@ismellbs.com',
        tags: ['education', 'university'],
        daysAgo: 7
    },
    {
        title: 'Bullshit Alert',
        content: 'Real estate listing: "Cozy starter home!" Translation: 400 sq ft closet with a toilet for $500k. The housing market is absolute bullshit.',
        author: 'James Anderson',
        email: 'james@example.com',
        tags: ['real-estate', 'housing'],
        daysAgo: 5
    },
    {
        title: 'Bullshit Alert',
        content: 'Celebrity: "I achieved this body with clean eating and exercise!" Meanwhile they have a personal chef, trainer, and probable plastic surgery. Be real!',
        author: 'Mary Taylor',
        email: 'mary@example.com',
        tags: ['celebrities', 'fitness'],
        daysAgo: 4
    },
    {
        title: 'Bullshit Alert',
        content: 'Traffic report: "Light delays expected." I\'ve been sitting in the same spot for 45 minutes. This is not "light" anything!',
        author: 'Anonymous',
        email: 'anonymous@ismellbs.com',
        tags: ['traffic', 'commute'],
        daysAgo: 3
    },
    {
        title: 'Bullshit Alert',
        content: 'Tech company: "We respect your privacy!" Collects every piece of data imaginable and sells it to advertisers. Yeah, sure you do.',
        author: 'Robert Thomas',
        email: 'robert@example.com',
        tags: ['privacy', 'tech', 'data'],
        daysAgo: 2
    },
    {
        title: 'Bullshit Alert',
        content: 'Restaurant menu: "Market price." AKA "We\'re going to charge you whatever we think we can get away with." Just tell me the damn price!',
        author: 'Karen Smith',
        email: 'karen@example.com',
        tags: ['restaurants', 'pricing'],
        daysAgo: 1
    },
    {
        title: 'Bullshit Alert',
        content: 'Streaming service raises prices again while removing content. They want us to pay more for less. That\'s some premium grade BS right there.',
        author: 'Anonymous',
        email: 'anonymous@ismellbs.com',
        tags: ['streaming', 'tech', 'pricing'],
        daysAgo: 0
    }
];
var comments = [
    'This is so true! I\'ve experienced the exact same thing.',
    'Finally someone said it!',
    'I can\'t believe this is still happening in 2025.',
    'Preach! 🙌',
    'This makes my blood boil.',
    'Welcome to the real world, folks.',
    'I thought it was just me noticing this BS!',
    'Story of my life right here.',
    'They think we\'re all stupid or something.',
    'This is why I have trust issues.',
    'Couldn\'t have said it better myself.',
    'The accuracy of this post is painful.',
    'I\'m so tired of this kind of thing.',
    'This needs to be talked about more.',
    'I laughed and then I cried because it\'s so true.',
    'How is this legal?!',
    'This is exactly what I was thinking!',
    'The gaslighting is real.',
    'I smell BS too!',
    'This should be illegal.'
];
function getRandomItem(array) {
    return array[Math.floor(Math.random() * array.length)];
}
function getRandomItems(array, count) {
    var shuffled = __spreadArray([], array, true).sort(function () { return 0.5 - Math.random(); });
    return shuffled.slice(0, count);
}
function createPost(post) {
    return __awaiter(this, void 0, void 0, function () {
        var createdAt, response, error_1;
        var _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    _b.trys.push([0, 2, , 3]);
                    createdAt = new Date();
                    createdAt.setDate(createdAt.getDate() - post.daysAgo);
                    return [4 /*yield*/, axios_1.default.post("".concat(API_URL, "/posts"), {
                            title: post.title,
                            content: post.content,
                            author: post.author,
                            email: post.email,
                            tags: post.tags,
                        })];
                case 1:
                    response = _b.sent();
                    console.log("\u2713 Created post by ".concat(post.author, " (").concat(post.daysAgo, " days ago)"));
                    return [2 /*return*/, response.data.post.id];
                case 2:
                    error_1 = _b.sent();
                    console.error("\u2717 Failed to create post:", ((_a = error_1.response) === null || _a === void 0 ? void 0 : _a.data) || error_1.message);
                    return [2 /*return*/, null];
                case 3: return [2 /*return*/];
            }
        });
    });
}
function createComment(postId, author, content) {
    return __awaiter(this, void 0, void 0, function () {
        var error_2;
        var _a, _b;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    _c.trys.push([0, 2, , 3]);
                    return [4 /*yield*/, axios_1.default.post("".concat(API_URL, "/comments"), {
                            postId: postId,
                            content: content,
                            author: author,
                        })];
                case 1:
                    _c.sent();
                    console.log("  \u2713 Added comment by ".concat(author));
                    return [3 /*break*/, 3];
                case 2:
                    error_2 = _c.sent();
                    console.error("  \u2717 Failed to create comment: ".concat(((_b = (_a = error_2.response) === null || _a === void 0 ? void 0 : _a.data) === null || _b === void 0 ? void 0 : _b.message) || error_2.message));
                    return [3 /*break*/, 3];
                case 3: return [2 /*return*/];
            }
        });
    });
}
function seedData() {
    return __awaiter(this, void 0, void 0, function () {
        var _i, posts_1, post, postId, numComments, selectedComments, i, isAnonymous, commentAuthor;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    console.log('🌱 Starting data seeding...\n');
                    _i = 0, posts_1 = posts;
                    _a.label = 1;
                case 1:
                    if (!(_i < posts_1.length)) return [3 /*break*/, 11];
                    post = posts_1[_i];
                    return [4 /*yield*/, createPost(post)];
                case 2:
                    postId = _a.sent();
                    if (!postId) return [3 /*break*/, 8];
                    numComments = Math.random() > 0.5 ? 4 : 3;
                    selectedComments = getRandomItems(comments, numComments);
                    i = 0;
                    _a.label = 3;
                case 3:
                    if (!(i < numComments)) return [3 /*break*/, 7];
                    isAnonymous = Math.random() > 0.5;
                    commentAuthor = isAnonymous ? 'Anonymous' : getRandomItem(names);
                    return [4 /*yield*/, createComment(postId, commentAuthor, selectedComments[i])];
                case 4:
                    _a.sent();
                    // Small delay to avoid rate limiting
                    return [4 /*yield*/, new Promise(function (resolve) { return setTimeout(resolve, 100); })];
                case 5:
                    // Small delay to avoid rate limiting
                    _a.sent();
                    _a.label = 6;
                case 6:
                    i++;
                    return [3 /*break*/, 3];
                case 7:
                    console.log('');
                    _a.label = 8;
                case 8: 
                // Delay between posts
                return [4 /*yield*/, new Promise(function (resolve) { return setTimeout(resolve, 500); })];
                case 9:
                    // Delay between posts
                    _a.sent();
                    _a.label = 10;
                case 10:
                    _i++;
                    return [3 /*break*/, 1];
                case 11:
                    console.log('✅ Data seeding complete!');
                    return [2 /*return*/];
            }
        });
    });
}
seedData().catch(console.error);
