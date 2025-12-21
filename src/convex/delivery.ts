"use node";
import { action } from "./_generated/server";
import { v } from "convex/values";

// Mock interface for a commercial logistics provider response (e.g., Shiprocket)
interface CourierRate {
  courier_name: string;
  rate: number;
  delivery_days: number;
  rating: number;
  etd: string;
}

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
      // 1. Location Lookup (Using public API)
      const response = await fetch(`https://api.postalpincode.in/pincode/${pincode}`);
      const data = await response.json();

      if (data && data[0].Status === "Success") {
        const district = data[0].PostOffice[0].District;
        const state = data[0].PostOffice[0].State;
        
        // 2. Commercial Logistics API Integration (Shiprocket Implementation)
        // This code block is ready to use with valid SHIPROCKET_EMAIL and SHIPROCKET_PASSWORD env vars
        
        let couriers: CourierRate[] = [];
        const shiprocketToken = process.env.SHIPROCKET_TOKEN;
        
        if (shiprocketToken) {
          try {
            // Example Shiprocket Serviceability API call
            // Note: In a real scenario, you'd likely authenticate first to get the token if not static
            const pickupPostcode = "110001"; // Your warehouse pincode
            
            const params = new URLSearchParams({
              pickup_postcode: pickupPostcode,
              delivery_postcode: pincode,
              weight: weight.toString(),
              cod: "1" // Check for COD availability
            });

            const srResponse = await fetch(`https://apiv2.shiprocket.in/v1/external/courier/serviceability/?${params.toString()}`, {
              method: 'GET',
              headers: {
                'Authorization': `Bearer ${shiprocketToken}`,
                'Content-Type': 'application/json'
              },
            });

            const srData = await srResponse.json();
            
            if (srData.status === 200 && srData.data && srData.data.available_courier_companies.length > 0) {
              couriers = srData.data.available_courier_companies.map((c: any) => ({
                courier_name: c.courier_name,
                rate: c.rate,
                delivery_days: parseInt(c.estimated_delivery_days) || 5,
                rating: c.rating || 4.0,
                etd: c.etd
              }));
            }
          } catch (err) {
            console.error("Shiprocket API failed, falling back to simulation", err);
          }
        }

        // 3. Enhanced Simulation (Fallback Logic if API fails or no token)
        if (couriers.length === 0) {
          const metros = ["Delhi", "Mumbai", "Bangalore", "Chennai", "Kolkata", "Hyderabad", "Pune", "Ahmedabad"];
          const isMetro = metros.some(city => 
            district.includes(city) || state.includes(city)
          );

          // Standard Courier (DTDC/Delhivery Surface)
          const standardDays = isMetro ? 3 : 5;
          const standardRate = isMetro ? 40 : 60;
          const standardDate = new Date();
          standardDate.setDate(standardDate.getDate() + standardDays);
          
          couriers.push({
            courier_name: "Standard Delivery (DTDC/Delhivery)",
            rate: standardRate,
            delivery_days: standardDays,
            rating: 4.2,
            etd: standardDate.toISOString()
          });

          // Express Courier (BlueDart/FedEx) - Available mostly in metros or major cities
          if (isMetro || Math.random() > 0.3) {
            const expressDays = isMetro ? 1 : 3;
            const expressRate = isMetro ? 80 : 120;
            const expressDate = new Date();
            expressDate.setDate(expressDate.getDate() + expressDays);

            couriers.push({
              courier_name: "Express (BlueDart/FedEx)",
              rate: expressRate,
              delivery_days: expressDays,
              rating: 4.8,
              etd: expressDate.toISOString()
            });
          }
        }

        // Select the best option (cheapest or fastest depending on business logic)
        // Here we default to the cheapest for the user display, but could offer choice
        const bestOption = couriers.sort((a, b) => a.rate - b.rate)[0];

        // Weight surcharge calculation for the base logic (if not using the courier rate directly)
        // We'll use the simulated courier rate but apply our business logic (e.g. free shipping)
        
        let finalShippingCharge = bestOption.rate;
        
        // Weight adjustment if not already in courier rate (simulated)
        if (!shiprocketToken) {
           const weightSurcharge = Math.max(0, Math.ceil((weight - 0.5) / 0.5)) * 20;
           finalShippingCharge += weightSurcharge;
        }

        // Free shipping logic
        if (orderValue > 999) {
          finalShippingCharge = 0;
        }

        return {
          available: true,
          location: `${district}, ${state}`,
          days: bestOption.delivery_days,
          estimatedDate: bestOption.etd,
          courier: bestOption.courier_name,
          shippingCharge: finalShippingCharge,
          isCodAvailable: true, // Shiprocket usually supports COD, or fallback logic
          courierOptions: couriers, // Return all options for potential UI expansion
        };
      } else {
        return { available: false, error: "Pincode not found or not serviceable" };
      }
    } catch (error) {
      return { available: false, error: "Failed to verify pincode" };
    }
  },
});