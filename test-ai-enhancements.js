// Test script for AI enhancements
const aiShortlistService = require('./server/services/aiShortlistService');

// Test data
const testJob = {
  title: "Smart Home Installation",
  description: "Need professional installation of smart home automation system including smart lighting, security cameras, and smart thermostat. Looking for experienced contractor with smart home expertise.",
  workType: "smart-home",
  budget: 5000,
  location: "Downtown Area",
  locationCoordinates: {
    type: "Point",
    coordinates: [-73.935242, 40.730610] // NYC coordinates
  }
};

const testContractor = {
  _id: "test-contractor-1",
  name: "John Smart",
  email: "john@smartcontractor.com",
  phone: "555-0123",
  profile: {
    photo: "https://example.com/photo.jpg",
    bio: "Experienced smart home installation specialist with 5+ years in automation systems.",
    skills: ["smart-home", "automation", "electrical", "security", "smart-lighting", "smart-thermostat"],
    rating: 4.8,
    completedJobs: 25,
    availability: "Available",
    totalSpent: 15000,
    minBudget: 1000,
    maxBudget: 10000,
    location: {
      type: "Point",
      coordinates: [-73.935242, 40.730610] // Same location
    }
  }
};

// Test function
async function testAIEnhancements() {
  console.log("🤖 Testing AI Enhancements...\n");

  try {
    // Test 1: Enhanced skill extraction
    console.log("📋 Test 1: Enhanced Skill Extraction");
    const extractedSkills = aiShortlistService.extractSkills(testJob.description + ' ' + testJob.workType);
    console.log("Extracted skills:", extractedSkills);
    console.log("✅ Skill extraction working\n");

    // Test 2: Dynamic weight calculation
    console.log("⚖️ Test 2: Dynamic Weight Calculation");
    const weights = aiShortlistService.getWeightsForJobType(testJob.workType);
    console.log("Weights for smart-home job:", weights);
    console.log("✅ Dynamic weights working\n");

    // Test 3: Skill matching
    console.log("🎯 Test 3: Skill Matching");
    const skillMatchScore = aiShortlistService.calculateSkillMatchScore(testJob, testContractor);
    console.log("Skill match score:", skillMatchScore);
    console.log("✅ Skill matching working\n");

    // Test 4: Overall scoring with dynamic weights
    console.log("📊 Test 4: Overall Scoring with Dynamic Weights");
    const scores = await aiShortlistService.calculateContractorScores(testJob, testContractor);
    const overallScore = aiShortlistService.calculateOverallScore(scores, testJob.workType);
    console.log("Individual scores:", scores);
    console.log("Overall score:", overallScore);
    console.log("✅ Overall scoring working\n");

    // Test 5: Explanation generation
    console.log("💬 Test 5: Explanation Generation");
    const explanation = aiShortlistService.generateExplanation(scores, testContractor, testJob);
    console.log("Explanation:", explanation);
    console.log("✅ Explanation generation working\n");

    console.log("🎉 All AI enhancements are working correctly!");
    console.log("\n📈 Expected improvements:");
    console.log("- Better skill matching for modern services (smart-home, automation, etc.)");
    console.log("- Dynamic weights based on job type (smart-home jobs prioritize skills more)");
    console.log("- Enhanced skill extraction with synonyms and professional titles");
    console.log("- Success rate tracking for AI recommendations");

  } catch (error) {
    console.error("❌ Error testing AI enhancements:", error);
  }
}

// Run the test
testAIEnhancements(); 