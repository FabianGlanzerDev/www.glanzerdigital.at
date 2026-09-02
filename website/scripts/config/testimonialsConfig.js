'use strict';

/**
 * Kunden- und Teamstimmen für die Startseite.
 *
 * Pflegehinweise:
 * - Neue Stimme: Ein Objekt in `items` kopieren und anpassen.
 * - Ausblenden: `visible: false` setzen.
 * - `organization` ist für Firmenname, Vereinsname oder Organisation gedacht.
 * - Englische Texte sind optional; fehlt `en`, wird automatisch Deutsch verwendet.
 * - Die Einträge unten sind Platzhalter und müssen vor Veröffentlichung durch echte Aussagen ersetzt werden.
 */
window.GD_TESTIMONIALS_CONFIG = {
  section: {
    kicker: { de: 'Erfahrungen', en: 'Experiences' },
    title: {
      de: 'Das sagen Kunden & Projektpartner',
      en: 'What clients & project partners say',
    },
    intro: {
      de: 'Rückmeldungen zu Zusammenarbeit, Kommunikation und gemeinsamen Projekten.',
      en: 'Feedback on collaboration, communication and shared projects.',
    },
  },

  items: [
    {
      id: 'kunde-1',
      visible: true,
      type: { de: 'Kundenfeedback', en: 'Client feedback' },
      quote: {
        de: 'Die Zusammenarbeit war unkompliziert und transparent. Wünsche wurden verständlich aufgenommen und die Umsetzung zuverlässig abgestimmt.',
        en: 'The collaboration was straightforward and transparent. Requirements were understood clearly and the implementation was coordinated reliably.',
      },
      person: 'Mario D.',
      organization: 'Akademie für ein g`sundes, besseres Leben',
      project: { de: 'Vereins Website', en: 'Website project' },
    },
    {
      id: 'team-1',
      visible: true,
      type: { de: 'Teamfeedback', en: 'Team feedback' },
      quote: {
        de: 'Die Zusammenarbeit war unkompliziert und strukturiert. Absprachen wurden zuverlässig umgesetzt und bei Problemen wurde schnell eine passende Lösung gefunden.',
        en: 'The collaboration was straightforward and well structured. Agreements were implemented reliably and suitable solutions were found quickly when problems arose.',
      },
      person: 'Vorname Nachname',
      organization: 'Projektteam Join',
      project: { de: 'Join · Teamprojekt', en: 'Join · Team project' },
    },
    {
      id: 'team-2',
      visible: true,
      type: { de: 'Teamfeedback', en: 'Team feedback' },
      quote: {
        de: 'Im Team konnte man sich auf Fabian jederzeit verlassen. Aufgaben wurden sauber erledigt, Rückfragen offen angesprochen und Ideen gemeinsam weiterentwickelt.',
        en: 'Fabian was always reliable within the team. Tasks were completed carefully, questions were discussed openly and ideas were developed together.',
      },
      person: 'Vorname Nachname',
      organization: 'Projektteam Join',
      project: { de: 'Join · Teamprojekt', en: 'Join · Team project' },
    },
    {
      id: 'team-3',
      visible: true,
      type: { de: 'Teamfeedback', en: 'Team feedback' },
      quote: {
        de: 'Besonders positiv fand ich die klare Kommunikation und die ruhige Zusammenarbeit. Auch bei Änderungen im Projekt blieb die Umsetzung organisiert und lösungsorientiert.',
        en: 'I especially appreciated the clear communication and calm collaboration. Even when the project changed, the work stayed organised and solution focused.',
      },
      person: 'Vorname Nachname',
      organization: 'Projektteam Join',
      project: { de: 'Join · Teamprojekt', en: 'Join · Team project' },
    },
    {
      id: 'team-4',
      visible: true,
      type: { de: 'Teamfeedback', en: 'Team feedback' },
      quote: {
        de: 'Die gemeinsame Projektarbeit hat sehr gut funktioniert. Fabian hat eigene Ideen eingebracht, Verantwortung übernommen und darauf geachtet, dass wir als Team gut vorankommen.',
        en: 'The project collaboration worked very well. Fabian contributed his own ideas, took responsibility and made sure the team kept moving forward.',
      },
      person: 'Vorname Nachname',
      organization: 'Projektteam Join',
      project: { de: 'Join · Teamprojekt', en: 'Join · Team project' },
    },
    {
      id: 'kunde-2',
      visible: true,
      type: { de: 'Kundenfeedback', en: 'Client feedback' },
      quote: {
        de: 'Von der ersten Abstimmung bis zur fertigen Lösung war die Kommunikation verständlich und direkt. Anpassungen konnten unkompliziert besprochen und umgesetzt werden.',
        en: 'From the first discussion to the finished solution, communication was clear and direct. Adjustments could be discussed and implemented without complications.',
      },
      person: 'Vorname Nachname',
      organization: 'Firmen- oder Vereinsname',
      project: { de: 'Website / Digitalisierung', en: 'Website / digitalisation' },
    },
  ],
};
