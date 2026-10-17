# Turning on accounts and groups

Iron works without accounts: each person's goals and check-ins save on their own phone. Turn on accounts and people can sign in with Google or email, their tracker follows them to any device, and you can run **groups**:

- A leader starts a group and gets a 6-character code.
- Members join with the code.
- A leader can make someone else a leader (your co-counselor).
- Leaders see each member's streak, today's progress, last 7 days, how each area is going and when they last checked in. **Leaders never see anyone's actual goals.** Anyone who hasn't checked in for 3+ days is flagged so you know who to reach out to.

Accounts use **Firebase**, Google's free service for sign-in and storage. The free plan covers far more than a few connection groups will ever use. Setup takes about 10 minutes and you only do it once.

## 1. Create a Firebase project
1. Go to https://console.firebase.google.com and sign in with a Google account you and your co-leader can both get into.
2. Click **Create a project**, name it something like `iron-group`, and turn Google Analytics off.

## 2. Turn on sign-in
1. Open **Build → Authentication** and click **Get started**.
2. On **Sign-in method**, enable **Google** (pick a support email) and **Email/Password** (just the first switch). Email matters because Google sign-in doesn't work inside Instagram's in-app browser.
3. Open **Settings → Authorized domains → Add domain** and add the address your site lives at, like `your-github-name.github.io`.

## 3. Create the database
1. Open **Build → Firestore Database → Create database**. Pick a location near you (for Iowa, `us-central1`) and choose **production mode**.
2. Open the **Rules** tab, replace everything with the rules below and click **Publish**.

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // Your own tracker: only you can read or write it.
    match /users/{uid} {
      allow read, write: if request.auth != null && request.auth.uid == uid;
    }

    match /groups/{code} {
      function signedIn() { return request.auth != null; }
      function isLeader() { return signedIn() && request.auth.uid in resource.data.leaders; }
      function changed() { return request.resource.data.diff(resource.data).affectedKeys(); }
      function added(field) { return request.resource.data[field].toSet().difference(resource.data[field].toSet()); }
      function removed(field) { return resource.data[field].toSet().difference(request.resource.data[field].toSet()); }

      // You can open a group only if you know its code. Nobody can list groups.
      allow get: if signedIn();
      allow list: if false;

      // Whoever starts a group is its first leader.
      allow create: if signedIn()
        && request.resource.data.leaders == [request.auth.uid]
        && request.resource.data.members == [request.auth.uid];

      // Leaders can change anything. Everyone else can only add or remove themselves.
      allow update: if isLeader()
        || (signedIn() && changed().hasOnly(['members'])
            && (added('members') == [request.auth.uid].toSet() || removed('members') == [request.auth.uid].toSet()));

      // Each person's shared numbers (never their goals).
      match /members/{uid} {
        function group() { return get(/databases/$(database)/documents/groups/$(code)).data; }
        allow read: if request.auth != null && (request.auth.uid == uid || request.auth.uid in group().leaders);
        allow create, update: if request.auth != null && request.auth.uid == uid && uid in group().members;
        allow delete: if request.auth != null && (request.auth.uid == uid || request.auth.uid in group().leaders);
      }
    }
  }
}
```

## 4. Connect the website
1. Click the **gear icon → Project settings**. Under **Your apps**, click the **`</>`** (web) button, name it `iron-web`, skip Hosting and click **Register app**.
2. Copy the part of `firebaseConfig` inside the curly braces.
3. Open `firebase-config.js` (on GitHub: click the file, then the pencil). Replace `null` in the last line with what you copied:

```js
window.IRON_FIREBASE = {
  apiKey: "AIza...",
  authDomain: "iron-group-xxxx.firebaseapp.com",
  projectId: "iron-group-xxxx",
  storageBucket: "iron-group-xxxx.appspot.com",
  messagingSenderId: "1234567890",
  appId: "1:1234567890:web:abc123"
};
```

4. Commit. A minute later a **Sign in** button and a **Your group** section show up on the site.

These config values aren't secret. Every Firebase website publishes them. The rules in step 3 are what keep everyone's data private.

## Starting your group
1. Sign in, add your name and tap **Start group**.
2. Tap **Copy invite** and send it to your group. It includes the link and the code.
3. When your co-counselor joins, tap **Make leader** next to their name.

## Testing locally (optional)
Adding `useEmulators: true` to the config points the site at the local Firebase emulators (Auth on port 9099, Firestore on 8089) instead of the live project. Never set it on the live site.

## Privacy
Signing in stores each person's email and name in your Firebase project, and only the project owners can see them. Leaders see the progress numbers described above, never anyone's goals. Delete someone's data from the Firebase console if they ask.
