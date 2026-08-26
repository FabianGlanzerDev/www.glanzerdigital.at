<?php

declare(strict_types=1);
http_response_code(503);
header('Retry-After: 3600');
header('Cache-Control: no-store, no-cache, must-revalidate');
?>
<!doctype html>
<html lang="de">

<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="description" content="Glanzer Digital befindet sich vorübergehend im Wartungsmodus.">
  <meta name="author" content="Fabian Glanzer">
  <meta name="robots" content="noindex,nofollow">
  <meta name="theme-color" content="#07101d">
  <title>Wartungsmodus | Glanzer Digital</title>
<link rel="icon" href="assets/favicons/favicon.ico" sizes="any">
  <link rel="icon" href="assets/favicons/favicon-32x32.png" type="image/png" sizes="32x32">
<link rel="apple-touch-icon" href="assets/favicons/apple-touch-icon.png" sizes="180x180">

  <style>
    :root {
      color-scheme: dark;
      font-family: Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif
    }

    * {
      box-sizing: border-box
    }

    body {
      display: grid;
      min-height: 100vh;
      margin: 0;
      padding: 1.2rem;
      place-items: center;
      color: #edf5ff;
      background: radial-gradient(circle at 50% 15%, rgba(47, 125, 255, .22), transparent 32%), #07101d
    }

    .maintenance-card {
      width: min(100%, 760px);
      padding: clamp(1.6rem, 5vw, 3rem);
      text-align: center;
      background: rgba(13, 23, 37, .96);
      border: 1px solid rgba(148, 177, 214, .18);
      border-radius: 24px;
      box-shadow: 0 26px 80px rgba(0, 0, 0, .34)
    }

    .maintenance-logo {
      display: block;
      width: min(260px, 70%);
      margin: 0 auto 1.5rem
    }

    .maintenance-kicker {
      color: #69aaff;
      font-size: .75rem;
      font-weight: 850;
      letter-spacing: .15em;
      text-transform: uppercase
    }

    .maintenance-card h1 {
      margin: .45rem 0 .8rem;
      font-size: clamp(2rem, 6vw, 3.6rem)
    }

    .maintenance-card p {
      max-width: 600px;
      margin: 0 auto;
      color: #9bacc0;
      font-size: 1rem;
      line-height: 1.7
    }

    .maintenance-status {
      display: inline-flex;
      margin-top: 1.4rem;
      padding: .65rem .9rem;
      gap: .55rem;
      align-items: center;
      color: #dce8f7;
      background: rgba(255, 255, 255, .04);
      border: 1px solid rgba(148, 177, 214, .18);
      border-radius: 999px
    }

    .maintenance-status::before {
      width: 9px;
      height: 9px;
      content: "";
      background: #ffc857;
      border-radius: 50%;
      box-shadow: 0 0 0 5px rgba(255, 200, 87, .12)
    }
  </style>
</head>

<body>
  <main class="maintenance-card">
    <img class="maintenance-logo" src="/assets/images/logos/glanzer-digital-logo.svg" alt="Glanzer Digital">
    <span class="maintenance-kicker">Kurze technische Pause</span>
    <h1>Wir sind gleich wieder da.</h1>
    <p>Glanzer Digital wird gerade aktualisiert. Die Website ist vorübergehend nicht erreichbar und kommt nach den Arbeiten automatisch wieder online.</p>
    <div class="maintenance-status" role="status">Wartungsmodus aktiv</div>
  </main>
</body>

</html>