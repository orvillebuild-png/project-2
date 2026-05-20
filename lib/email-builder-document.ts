import type { TReaderDocument } from "@usewaypoint/email-builder";

export type EmailBuilderFont =
  | "MODERN_SANS"
  | "BOOK_SANS"
  | "ORGANIC_SANS"
  | "GEOMETRIC_SANS"
  | "HEAVY_SANS"
  | "ROUNDED_SANS"
  | "MODERN_SERIF"
  | "BOOK_SERIF"
  | "MONOSPACE";

export type EmailBuilderDocument = TReaderDocument;

export type EmailBuilderDraft = {
  accentColor: string;
  backdropColor: string;
  bodyText: string;
  buttonLabel: string;
  buttonTextColor: string;
  canvasColor: string;
  footerText: string;
  fontFamily: EmailBuilderFont;
  headerColor: string;
  headline: string;
  imageAlt: string;
  imageUrl: string;
  imageWidth: number;
  textColor: string;
};

export const emailBuilderFonts: Array<{ label: string; value: EmailBuilderFont; css: string }> = [
  { label: "Modern Sans", value: "MODERN_SANS", css: '"Helvetica Neue", "Arial Nova", Arial, sans-serif' },
  { label: "Book Sans", value: "BOOK_SANS", css: 'Optima, Candara, "Noto Sans", sans-serif' },
  { label: "Organic Sans", value: "ORGANIC_SANS", css: 'Seravek, "Gill Sans Nova", Calibri, sans-serif' },
  { label: "Geometric Sans", value: "GEOMETRIC_SANS", css: 'Avenir, Montserrat, Corbel, sans-serif' },
  { label: "Heavy Sans", value: "HEAVY_SANS", css: 'Bahnschrift, "Franklin Gothic Medium", sans-serif' },
  { label: "Rounded Sans", value: "ROUNDED_SANS", css: 'ui-rounded, Quicksand, Comfortaa, Calibri, sans-serif' },
  { label: "Modern Serif", value: "MODERN_SERIF", css: 'Charter, Cambria, serif' },
  { label: "Book Serif", value: "BOOK_SERIF", css: '"Iowan Old Style", "Palatino Linotype", serif' },
  { label: "Monospace", value: "MONOSPACE", css: '"Nimbus Mono PS", "Courier New", monospace' }
];

export function safeHex(value: string, fallback: string) {
  return /^#[0-9a-fA-F]{6}$/.test(value) ? value : fallback;
}

export function defaultEmailBuilderDraft(defaultBody = ""): EmailBuilderDraft {
  return {
    accentColor: "#ffca3a",
    backdropColor: "#f8f5eb",
    bodyText: normalizeBodyText(defaultBody),
    buttonLabel: "RSVP now",
    buttonTextColor: "#161616",
    canvasColor: "#ffffff",
    footerText: "Thank you.",
    fontFamily: "MODERN_SANS",
    headerColor: "#161616",
    headline: "You are invited to {{event_title}}",
    imageAlt: "",
    imageUrl: "",
    imageWidth: 560,
    textColor: "#181713"
  };
}

export function normalizeBodyText(value: string) {
  const trimmed = value.trim();

  if (!trimmed) {
    return [
      "Hi {{first_name}},",
      "",
      "You are invited to {{event_title}} on {{event_date}} at {{venue}}.",
      "",
      "Please RSVP here: {{rsvp_link}}",
      "",
      "Thank you."
    ].join("\n");
  }

  if (!trimmed.startsWith("<")) {
    return trimmed;
  }

  return trimmed
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export function buildEmailBuilderDocument(draft: EmailBuilderDraft): EmailBuilderDocument {
  const childrenIds = ["hero", "body"];

  if (draft.imageUrl) {
    childrenIds.push("image");
  }

  childrenIds.push("button", "footer");

  return {
    root: {
      type: "EmailLayout",
      data: {
        backdropColor: draft.backdropColor,
        borderColor: "#dfdccf",
        borderRadius: 18,
        canvasColor: draft.canvasColor,
        textColor: draft.textColor,
        fontFamily: draft.fontFamily,
        childrenIds
      }
    },
    hero: {
      type: "Container",
      data: {
        style: {
          backgroundColor: draft.headerColor,
          padding: { top: 34, right: 30, bottom: 32, left: 30 }
        },
        props: {
          childrenIds: ["eyebrow", "headline"]
        }
      }
    },
    eyebrow: {
      type: "Text",
      data: {
        style: {
          color: draft.accentColor,
          fontSize: 12,
          fontFamily: draft.fontFamily,
          fontWeight: "bold",
          padding: { top: 0, right: 0, bottom: 14, left: 0 }
        },
        props: {
          text: "INVITATION"
        }
      }
    },
    headline: {
      type: "Heading",
      data: {
        style: {
          color: "#ffffff",
          fontFamily: draft.fontFamily,
          fontWeight: "bold",
          padding: { top: 0, right: 0, bottom: 0, left: 0 }
        },
        props: {
          level: "h1",
          text: draft.headline
        }
      }
    },
    body: {
      type: "Text",
      data: {
        style: {
          color: draft.textColor,
          fontSize: 15,
          fontFamily: draft.fontFamily,
          padding: { top: 28, right: 30, bottom: 16, left: 30 }
        },
        props: {
          markdown: true,
          text: draft.bodyText
        }
      }
    },
    image: {
      type: "Image",
      data: {
        style: {
          backgroundColor: draft.canvasColor,
          textAlign: "center",
          padding: { top: 4, right: 30, bottom: 20, left: 30 }
        },
        props: {
          alt: draft.imageAlt,
          contentAlignment: "middle",
          url: draft.imageUrl,
          width: draft.imageWidth
        }
      }
    },
    button: {
      type: "Button",
      data: {
        style: {
          backgroundColor: draft.canvasColor,
          fontFamily: draft.fontFamily,
          fontSize: 15,
          fontWeight: "bold",
          textAlign: "left",
          padding: { top: 8, right: 30, bottom: 28, left: 30 }
        },
        props: {
          buttonBackgroundColor: draft.accentColor,
          buttonStyle: "pill",
          buttonTextColor: draft.buttonTextColor,
          fullWidth: false,
          size: "medium",
          text: draft.buttonLabel,
          url: "{{rsvp_link}}"
        }
      }
    },
    footer: {
      type: "Text",
      data: {
        style: {
          color: "#716f66",
          fontSize: 12,
          fontFamily: draft.fontFamily,
          padding: { top: 18, right: 30, bottom: 28, left: 30 }
        },
        props: {
          markdown: true,
          text: draft.footerText
        }
      }
    }
  };
}

export function isEmailBuilderDocument(value: unknown): value is EmailBuilderDocument {
  return typeof value === "object" && value !== null && !Array.isArray(value) && "root" in value;
}
