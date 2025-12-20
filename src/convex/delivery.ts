"use node";
import { action } from "./_generated/server";
import { v } from "convex/values";

export const checkAvailability = action({
  args: { 
    pincode: v.string(),
    weight: v.optional(v.number()), // Weight in kg
    orderValue: v.optional(v.number()), // For free shipping calculation
  },
  handler: async (ctx, args) => {
    const { pincode, weight = 0.5, orderValue = 0 } = args;

    if (!/^\d{6}$/.test(pincode)) {
      return { available: false, error: "Invalid pincode format" };
    }

    try {
      // Fetch location details from public API
      const response = await fetch(`https://api.postalpincode.in/pincode/${pincode}`);
      const data = await response.json();

      if (data && data[0].Status === "Success") {
        const district = data[0].PostOffice[0].District;
        const state = data[0].PostOffice[0].State;
        
        // Enhanced Logistics Simulation
        
        const metros = ["Delhi", "Mumbai", "Bangalore", "Chennai", "Kolkata", "Hyderabad", "Pune", "Ahmedabad"];
        const isMetro = metros.some(city => 
          district.includes(city) || state.includes(city)
        );

        // Calculate delivery days
        let daysToDeliver = isMetro ? 2 : 4;
        // Add delay for remote states
        if (["Jammu & Kashmir", "Assam", "Manipur", "Meghalaya", "Mizoram", "Nagaland", "Tripura", "Arunachal Pradesh", "Sikkim"].includes(state)) {
          daysToDeliver += 3;
        }

        const deliveryDate = new Date();
        deliveryDate.setDate(deliveryDate.getDate() + daysToDeliver);

        // Calculate Shipping Charge
        let baseRate = isMetro ? 40 : 60;
        
        // Weight surcharge (every 500g over 0.5kg adds Rs. 20)
        const weightSurcharge = Math.max(0, Math.ceil((weight - 0.5) / 0.5)) * 20;
        
        let shippingCharge = baseRate + weightSurcharge;

        // Free shipping logic
        if (orderValue > 999) {
          shippingCharge = 0;
        }

        return {
          available: true,
          location: `${district}, ${state}`,
          days: daysToDeliver,
          estimatedDate: deliveryDate.toISOString(),
          courier: isMetro ? "Express BlueDart" : "Standard DTDC",
          shippingCharge: shippingCharge,
          isCodAvailable: isMetro, // COD only in metros for this simulation
        };
      } else {
        return { available: false, error: "Pincode not found or not serviceable" };
      }
    } catch (error) {
      return { available: false, error: "Failed to verify pincode" };
    }
  },
});