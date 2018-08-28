import { connectSession } from 'rxq';
import { GetDocList, OpenDoc } from 'rxq/Global';
import { switchMap, tap, map, shareReplay, withLatestFrom } from 'rxjs/operators';
import { fromEvent } from 'rxjs';

// Engine Config
const config = {
  host: '172.16.84.100/app/engineData',
  isSecure: true
}

// Create Session
const session = connectSession(config);
// Connect to engine
const global$ = session.global$


// GetDocList
const appList$ = global$.pipe(
  switchMap(h => h.ask(GetDocList)),
  shareReplay(1)
)


// Use doc list to create dropdown options
const createDropdown$ = appList$.pipe(
  map(appList => {
    const dropdown = document.getElementById('app-dropdown')
    appList.forEach(app => {
      // Create option element
      const option = document.createElement('option');
      // Set value attr on <option>
      option.setAttribute('value', app.qDocId);
      option.setAttribute('class', 'app-option')
      // Create new text node
      const appText = document.createTextNode(app.qDocName)
      // append text node into <option>
      option.appendChild(appText);
  
      // append <option> into <select>
      dropdown.appendChild(option)
    })

    return dropdown
  })
)


// select dropdown option
const selectApp$ = createDropdown$.pipe(
  switchMap(dropdown => fromEvent(dropdown, 'change').pipe(
    map(option => option.target.value)
  ))
)


// Open app
const app$ = selectApp$.pipe(
  /* take the appid we get from selectApp$ and return an object
      that contains a new session config as well as the appid */
  map(appid => ({
    appid,
    config: {
      host: '172.16.84.100/app/engineData',
      isSecure: true,
      appname: appid
    }
  })),
  // Create a new session using the new config
  switchMap(({ appid, config }) => connectSession(config).global$.pipe(
    // Open the app in this new session
    switchMap(globalHandle => globalHandle.ask(OpenDoc, appid)),
    shareReplay(1)
  ))
)

app$.subscribe(console.log)