"use node";
import { action } from "./_generated/server";
import { v } from "convex/values";

export const checkAvailability = action({
  args: { pincode: v.string() },
  handler: async (ctx, args) => {
    const { pincode } = args;

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
        
        // Simulate logistics logic based on region
        // In a real app, this would call Shiprocket/Delhivery API
        
        const isMetro = ["Delhi", "Mumbai", "Bangalore", "Chennai", "Kolkata"].some(city => 
          district.includes(city) || state.includes(city)
        );

        const daysToDeliver = isMetro ? 2 : 4;
        const deliveryDate = new Date();
        deliveryDate.setDate(deliveryDate.getDate() + daysToDeliver);

        return {
          available: true,
          location: `${district}, ${state}`,
          days: daysToDeliver,
          estimatedDate: deliveryDate.toISOString(),
          courier: isMetro ? "Express BlueDart" : "Standard DTDC",
          shippingCharge: isMetro ? 0 : 40, // Free shipping for metros
        };
      } else {
        return { available: false, error: "Pincode not found" };
      }
    } catch (error) {
      return { available: false, error: "Failed to verify pincode" };
    }
  },
});
