class Plan {

  constructor (stripePlan) {
    this.name = stripePlan.metadata.app_name;
    this.description = stripePlan.metadata.app_description;
    this.id = stripePlan.id;
    this.price = stripePlan.amount / 100;
    this.currency = stripePlan.currency;
    this.interval = stripePlan.interval;
  }
}

module.exports = Plan