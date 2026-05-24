# Day 2 — GitHub OAuth Notes

> Everything I learned about OAuth, NestJS, and OOP on Day 2 of building CodeForge.

---

## How OAuth works — the full flow

```
User clicks Login with GitHub
        ↓
@UseGuards redirects user to GitHub's login page
        ↓
User types password ON GITHUB DIRECTLY
Your app never sees the password. Ever.
        ↓
User clicks approve
GitHub generates a CODE unique to this user
        ↓
Passport receives the code
sends code + clientSecret to GitHub
        ↓
GitHub verifies → sends back accessToken
(server to server — never touches the browser)
        ↓
Passport fetches user profile using accessToken
        ↓
Your validate() receives profile
returns user object → becomes req.user
        ↓
Controller returns user to frontend ✅
```

---

## Same for everyone vs unique per user

| Thing        | Belongs to                 | Changes per user?  |
| ------------ | -------------------------- | ------------------ |
| clientID     | CodeForge app              | same for all users |
| clientSecret | CodeForge app              | same for all users |
| code         | each user's approval       | unique per user    |
| accessToken  | each user's GitHub session | unique per user    |
| profile      | each user's GitHub data    | unique per user    |

---

## Why both code AND secret are needed

```
clientSecret  →  proves YOUR APP (CodeForge) is real
code          →  proves THIS SPECIFIC USER just approved

secret alone  →  GitHub asks: "okay but WHICH user?"
code alone    →  GitHub asks: "okay but which APP?"
both together →  GitHub knows exactly who approved what ✅
```

The code travels inside the user's own browser request.
That is how the backend knows which user it belongs to.

---

## Why code instead of accessToken in the URL

```
DANGEROUS ❌
GitHub sends accessToken in the URL
http://yourapp.com/callback?access_token=secret123
Visible in browser history, server logs, network tab

SAFE ✅
GitHub sends a useless code in the URL
http://yourapp.com/callback?code=abc123
Backend privately exchanges code + secret for real token
accessToken never touches the browser
```

---

## Two different tokens — never confuse these

| Token              | Proves you to        | Who creates it                    |
| ------------------ | -------------------- | --------------------------------- |
| GitHub accessToken | GitHub               | Passport fetches it automatically |
| JWT                | CodeForge (your app) | You generate it yourself (Day 4)  |

---

## Sessions — now vs Day 4

**Day 2 — session: true (temporary)**

- Server remembers the user
- Browser gets a session ID cookie
- Like a hotel key card — server holds your data, gives you an ID

**Day 4 — session: false + JWT (proper way)**

- Server remembers nothing
- User carries a JWT token
- User sends JWT with every request to prove who they are
- Like a wristband — your info is on you, server just reads it

```ts
// Day 2 — temporary
PassportModule.register({ session: true });

// Day 4 — switch to this
PassportModule.register({ session: false });
JwtModule.register({ secret: process.env.JWT_SECRET, expiresIn: "7d" });
```

---

## Who does what in the code

| Layer                | Does what                                                    |
| -------------------- | ------------------------------------------------------------ |
| `passport-github2`   | Talks to GitHub, exchanges code, fetches profile             |
| `PassportStrategy()` | Function that returns a class — wraps passport for NestJS    |
| Your `validate()`    | Receives profile, picks what to keep → becomes req.user      |
| Your controller      | Just returns req.user to frontend — guard does the real work |

---

## OOP concepts learned

### class

A blueprint for creating objects. Like a dog template — create many dogs from one class.

```js
class Dog {
  constructor(name) {
    this.name = name;
  }
  bark() {
    console.log(this.name + " says woof");
  }
}
const dog1 = new Dog("Bruno");
dog1.bark(); // "Bruno says woof"
```

### extends

Inherit everything from a parent class, then add your own stuff on top.

```js
class GuideDog extends Dog {
  constructor(name, owner) {
    super(name); // runs Dog's constructor first
    this.owner = owner; // then adds its own stuff
  }
}
```

### super()

Calls the parent class constructor. Must happen before using `this`.
In GithubStrategy — passes clientID, clientSecret up to PassportBase to set up OAuth.

### this

Refers to the specific object that called the method.
`dog1.name` and `dog2.name` are different because `this` refers to each specific instance.

### static method

Called on the class itself — no instance needed.
Used when the data is the same for everyone.

```js
Math.random()                          // static — no new Math() needed
PassportModule.register({ ... })       // static — same idea
```

### @Injectable()

NestJS manages this class for you automatically.
No need to do `new GithubStrategy()` yourself.
Register it in `providers: []` and NestJS creates and shares it.

---

## PassportStrategy — a function that returns a class

```js
// PassportStrategy is a FUNCTION
// you pass GitHub's Strategy into it
// it returns a class customized for GitHub

const BaseClass = PassportStrategy(Strategy, "github");
// BaseClass is now a class built for GitHub specifically

class GithubStrategy extends BaseClass {
  // your config and validate() go here
}
```

The `'github'` string is what matters — not the class name.
It is used in guards: `@AuthGuard('github')`

---

## Module structure — what goes where

```ts
@Module({
  imports: [],      // other @Module() classes
                    // things that SET UP external libraries
                    // PassportModule, JwtModule, TypeOrmModule

  controllers: [],  // classes with @Controller()
                    // things that RECEIVE HTTP requests
                    // AuthController, UserController

  providers: [],    // classes with @Injectable()
                    // things that DO the work
                    // Services, Strategies, Guards
})
```

---

## File structure for auth module

```
src/auth/
  auth.constants.ts   → GITHUB_SCOPES constant
  auth.types.ts       → GithubProfile, GithubUser, RequestWithUser interfaces
  auth.controller.ts  → /auth/github and /auth/github/callback routes
  auth.module.ts      → module setup, registers all pieces
  auth.service.ts     → business logic (save user, generate JWT on Day 4)
  github.strategy.ts  → GitHub OAuth strategy
```

---

## TypeScript tips learned

```ts
// use import type for interfaces — removes from compiled JS
import type { RequestWithUser } from './auth.types';

// interface — describes the shape of an object
interface GithubProfile {
  id: string;
  username: string;
  emails: Array<{ value: string }>;
}

// avoid any — use interfaces instead
validate(profile: GithubProfile)  // ✅
validate(profile: any)            // ❌

// remove async if no await inside
validate(profile: GithubProfile) { ... }        // ✅
async validate(profile: GithubProfile) { ... }  // ❌ if no await
```
