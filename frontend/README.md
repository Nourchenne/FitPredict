# Angular Frontend

This frontend has been restructured to use Angular (standalone components) instead of React/Vite.

## Project structure

- `src/main.ts` bootstraps the Angular app.
- `src/app/app.component.*` contains the root component scaffold.
- `src/styles.css` holds global styles.

## Development

Install dependencies and run the dev server:

- `npm install`
- `npm start`

The app will run on the default Angular dev server (usually `http://localhost:4200`).

## Next steps

- Create Angular components for the churn form and batch upload.
- Add Angular services to call the FastAPI endpoints.
- Port the existing React styles into Angular component styles or `src/styles.css`.
