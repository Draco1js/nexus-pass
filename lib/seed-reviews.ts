"use node";

import dotenv from 'dotenv'
dotenv.config({ quiet: true })
dotenv.config({path: "./.env.local"})
dotenv.config({ path: "../.env.local", quiet: true})

// Sample reviews data
const sampleReviews = [
	{
		artistName: "Demi Lovato",
		reviews: [
			{
				userName: "Big Fan",
				rating: 5,
				title: "Concert was great - info on VIP amenities were unclear",
				comment: "Demi was everything we hoped to hear/see during the recent concert. We purchased VIP passes for the show, and received some fun merch in the mail during the week prior to the show - no written explanation included.",
				venueName: "Arts Council - Karachi",
			},
			{
				userName: "Music Lover",
				rating: 5,
				title: "Amazing Performance",
				comment: "True showman. Played for 3 hours. Played songs from every genre. Wonderful evening.",
				venueName: "Neon Square - Lahore",
			},
			{
				userName: "P L",
				rating: 5,
				title: "Very Satisfied",
				comment: "Fantastic! Demi's voice was amazing. As a fan, I was not disappointed.",
				venueName: "National Arts Council - Islamabad",
			},
		],
	},
	{
		artistName: "Ariana Grande",
		reviews: [
			{
				userName: "Ariana Fan",
				rating: 5,
				title: "Best concert ever!",
				comment: "Ariana's vocals were incredible live. The production was top-notch and the energy was amazing throughout the entire show.",
				venueName: "Arts Council - Karachi",
			},
			{
				userName: "Concert Goer",
				rating: 4,
				title: "Great show, long wait",
				comment: "The performance was fantastic, but the opening act was delayed which made the wait longer than expected.",
				venueName: "Neon Square - Lahore",
			},
		],
	},
];

async function main() {
	try {
		console.log("\n📤 Sending review data to Convex...");

		const convexUrl = process.env.NEXT_PUBLIC_CONVEX_SITE_URL;
		if (!convexUrl) {
			throw new Error("NEXT_PUBLIC_CONVEX_SITE_URL environment variable is not set");
		}

		const response = await fetch(`${convexUrl}/api/seed-reviews`, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify({ reviews: sampleReviews }),
		});

		if (!response.ok) {
			const errorData = await response.json();
			throw new Error(
				`HTTP error! Status: ${response.status}, Details: ${JSON.stringify(errorData)}`,
			);
		}

		const result = await response.json();
		console.log("✅ Reviews seeded successfully:", result);
	} catch (error) {
		console.error("❌ Seeding reviews failed:", error);
	}
}

if (require.main === module) {
	main();
}

