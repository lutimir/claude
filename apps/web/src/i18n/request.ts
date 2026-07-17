import { getRequestConfig } from "next-intl/server";

// UI je zatiaľ len po slovensky; všetky texty však žijú v prekladových
// súboroch, takže čeština (fáza 8) sa doplní bez zásahu do komponentov.
export default getRequestConfig(async () => ({
  locale: "sk",
  messages: (await import("../messages/sk.json")).default,
}));
