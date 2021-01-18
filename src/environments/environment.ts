// This file can be replaced during build by using the `fileReplacements` array.
// `ng build ---prod` replaces `environment.ts` with `environment.prod.ts`.
// The list of file replacements can be found in `angular.json`.

export const environment = {
  production: false,
  firebaseConfig: {
    apiKey: "AIzaSyBvQj3EBP8at9r-pHLzeQvfDqpTPnOP8Pw",
    authDomain: "lobby-fi.firebaseapp.com",
    databaseURL: "https://lobby-fi.firebaseio.com",
    projectId: "lobby-fi",
    storageBucket: "lobby-fi.appspot.com",
    messagingSenderId: "19890574249"
}
}

/*
 * In development mode, to ignore zone related error stack frames such as
 * `zone.run`, `zoneDelegate.invokeTask` for easier debugging, you can
 * import the following file, but please comment it out in production mode
 * because it will have performance impact when throw error
 */
// import 'zone.js/dist/zone-error';  // Included with Angular CLI.
