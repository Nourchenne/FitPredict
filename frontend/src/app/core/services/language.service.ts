import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class LanguageService {
  // English only translations
  private translations: { [key: string]: string } = {
    'nav.home': '🏠 Home',
    'nav.prediction': '🎯 Prediction',
    'nav.workouts': '💪 Workouts',
    'nav.recipes': '🍽️ Recipes',
    
    'form.title': '💪 Obesity Level Prediction - FitPredict',
    'form.description': 'Fill this simple form to discover your personalized health recommendations',
    'form.gender': '👤 Gender',
    'form.gender_hint': 'Your biological sex',
    'form.male': 'Male',
    'form.female': 'Female',
    'form.age': '📅 Age (years)',
    'form.age_hint': 'Between 1 and 130 years',
    'form.height': '📏 Height (cm)',
    'form.height_hint': 'Your height in centimeters',
    'form.weight': '⚖️ Weight (kg)',
    'form.weight_hint': 'Your current weight',
    'form.family_history': '👨‍👩‍👧 Family History',
    'form.family_history_hint': 'Overweight in family?',
    'form.yes': 'Yes',
    'form.no': 'No',
    'form.favc': '🍔 Frequent High Calorie Foods',
    'form.favc_hint': 'Do you often eat fries/burgers/soda?',
    'form.fcvc': '🥗 Vegetable Frequency',
    'form.fcvc_hint': 'Meals with vegetables per week',
    'form.ncp': '🍽️ Number of Meals Per Day',
    'form.ncp_hint': 'Breakfast, lunch, dinner, etc.',
    'form.caec': '🍪 Snacks Between Meals',
    'form.caec_hint': 'Frequency of snacking',
    'form.sometimes': 'Sometimes',
    'form.frequently': 'Frequently',
    'form.always': 'Always',
    'form.between': 'Between',
    'form.smoke': '🚭 Do you smoke?',
    'form.smoke_hint': 'Do you consume tobacco?',
    'form.water': '💧 Water Per Day (Liters)',
    'form.water_hint': 'Daily water consumption',
    'form.scc': '📊 Calorie Counter',
    'form.scc_hint': 'Do you track calorie intake?',
    'form.activity': '🏃 Physical Activity (h/week)',
    'form.activity_hint': 'Sports, gym, walking, etc.',
    'form.screen': '📱 Screen Time (h/day)',
    'form.screen_hint': 'TV, computer, phone',
    'form.alcohol': '🍷 Alcohol Consumption',
    'form.alcohol_hint': 'Consumption frequency',
    'form.never': 'Never',
    'form.transport': '🚗 Usual Transport Mode',
    'form.transport_hint': 'Active means = more exercise',
    'form.public': 'Public Transport',
    'form.car': 'Car',
    'form.bike': 'Bike',
    'form.motorbike': 'Motorbike',
    'form.walking': 'Walking',
    'form.submit': 'Predict My Obesity Level',
    'form.reset': 'Reset',
    'form.error': 'Error during prediction',
    'form.required': 'This field is required',
    
    'workouts.title': '💪 FitPredict Training Programs',
    'workouts.description': 'Discover our personalized programs tailored to your level',
    'workouts.difficulty': 'Difficulty',
    'workouts.start': 'Start',
    'workouts.exercises': 'Included exercises:',
    
    'recipes.title': '🍽️ Healthy Recipes - FitPredict',
    'recipes.description': 'Delicious and nutritious recipes for your wellness',
    'recipes.ingredients': '🛒 Ingredients:',
    'recipes.instructions': '👨‍🍳 Instructions:',
    'recipes.favorite': '❤️ Add to favorites',
    'recipes.calories': 'Calories',
    'recipes.protein': 'Protein',
    'recipes.carbs': 'Carbs',
    'recipes.fat': 'Fat',
    'recipes.prep_time': 'Prep time',
    'recipes.servings': 'Servings',
    
    'footer.brand': '💪 FitPredict',
    'footer.description': 'Predict your obesity level and get personalized fitness recommendations',
    'footer.navigation': 'Navigation',
    'footer.technologies': 'Technologies',
    'footer.copyright': '© 2026 FitPredict. All rights reserved.',
    'footer.developed': 'Developed with ❤️ for a healthier life'
  };

  constructor() {}

  t(key: string): string {
    return this.translations[key] || key;
  }
}
