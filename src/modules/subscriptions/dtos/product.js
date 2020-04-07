class Product {

  constructor (stripeProduct) {
    this.name = stripeProduct.metadata.app_name;
    this.description = stripeProduct.metadata.app_description;
    this.prodId = stripeProduct.id;
    this.plans = {};
  }

  setPlans (stripePlans) {

    for (const stripePlan of stripePlans) {
      this.plans[stripePlan.interval] = {
        price: stripePlan.amount / 100,
        currency: stripePlan.currency,
        stripeId: stripePlan.id
      }
    }
  }
}

module.exports = Product