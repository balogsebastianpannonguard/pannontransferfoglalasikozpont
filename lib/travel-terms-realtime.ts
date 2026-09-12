type TravelTermsEvent =
  | { type: "terms_updated"; payload: unknown }
  | { type: "access_updated"; payload: unknown }
  | { type: "heartbeat"; payload: { timestamp: number } };

type TravelTermsListener = (event: TravelTermsEvent) => void;

const listeners = new Set<TravelTermsListener>();

export function subscribeToTravelTerms(listener: TravelTermsListener) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function publishTravelTermsEvent(event: TravelTermsEvent) {
  for (const listener of listeners) {
    try {
      listener(event);
    } catch {
      // Egy hibás kliens ne törje meg a többi valós idejű frissítését.
    }
  }
}
