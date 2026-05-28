/// Bundled mirror of `subscriptionPlans/*` (backend/firebase/seed) so the
/// paywall renders without a network round-trip. In production these would be
/// fetched from Firestore + reconciled with the store / RevenueCat.

class PlanPrice {
  const PlanPrice(this.currency, this.display);
  final String currency;
  final String display;
}

class SubPlan {
  const SubPlan({
    required this.id,
    required this.tier,
    required this.interval,
    required this.trialDays,
    required this.features,
    required this.priceByRegion,
  });

  final String id;
  final String tier; // super | max
  final String interval; // monthly | annual
  final int trialDays;
  final List<String> features;
  final Map<String, PlanPrice> priceByRegion;

  PlanPrice priceFor(String region) =>
      priceByRegion[region] ?? priceByRegion['US']!;
}

const subscriptionPlans = <SubPlan>[
  SubPlan(
    id: 'super-monthly',
    tier: 'super',
    interval: 'monthly',
    trialDays: 0,
    features: ['Unlimited hearts', 'No ads', 'Unlimited OMR sheet uploads'],
    priceByRegion: {
      'US': PlanPrice('USD', r'$12.99/mo'),
      'JP': PlanPrice('JPY', '¥1,300/mo'),
      'IN': PlanPrice('INR', '₹499/mo'),
      'BR': PlanPrice('BRL', r'R$29,90/mês'),
    },
  ),
  SubPlan(
    id: 'super-annual',
    tier: 'super',
    interval: 'annual',
    trialDays: 14,
    features: [
      'Unlimited hearts',
      'No ads',
      'Unlimited OMR sheet uploads',
      'Personalized practice',
    ],
    priceByRegion: {
      'US': PlanPrice('USD', r'$83.33/yr'),
      'JP': PlanPrice('JPY', '¥9,800/yr'),
      'IN': PlanPrice('INR', '₹3,399/yr'),
      'BR': PlanPrice('BRL', r'R$189,90/ano'),
    },
  ),
  SubPlan(
    id: 'max-annual',
    tier: 'max',
    interval: 'annual',
    trialDays: 14,
    features: [
      'Everything in Super',
      'AI tutor feedback',
      'Priority OMR processing',
      'Exclusive song packs',
    ],
    priceByRegion: {
      'US': PlanPrice('USD', r'$166.67/yr'),
      'JP': PlanPrice('JPY', '¥19,800/yr'),
      'IN': PlanPrice('INR', '₹6,799/yr'),
      'BR': PlanPrice('BRL', r'R$379,90/ano'),
    },
  ),
];
