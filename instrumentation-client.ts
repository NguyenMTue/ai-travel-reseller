import { initializeAnalytics } from "./src/lib/analytics";

// Load the SDK only when both existing analytics settings are configured.
// Explicit funnel events share this initialization; privacy options stay intact.
void initializeAnalytics();