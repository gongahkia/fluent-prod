import React from 'react';
import { Search, MapPin, TrendingUp, Video, Users, ShoppingBag, Calendar, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

const popularDestinations = [
  { name: "Tokyo, Japan", trending: "Anime Culture", icon: "🇯🇵", count: 24 },
  { name: "São Paulo, Brazil", trending: "Street Art", icon: "🇧🇷", count: 156 },
  { name: "Stockholm, Sweden", trending: "Design", icon: "🇸🇪", count: 45 },
  { name: "Mexico City, Mexico", trending: "Food Culture", icon: "🇲🇽", count: 123 }
];

const contentTypes = [
  { name: "Trending News", icon: TrendingUp, count: 24, color: "bg-red-100 text-red-700" },
  { name: "Local Videos", icon: Video, count: 156, color: "bg-green-100 text-green-700" },
  { name: "Social Content", icon: Users, count: 89, color: "bg-orange-100 text-orange-700" },
  { name: "Commerce", icon: ShoppingBag, count: 45, color: "bg-purple-100 text-purple-700" },
  { name: "Cultural Events", icon: Calendar, count: 78, color: "bg-blue-100 text-blue-700" },
  { name: "Language Exchange", icon: MessageCircle, count: 12, color: "bg-pink-100 text-pink-700" }
];

const Sidebar = ({ onDestinationClick, selectedDestination }) => {
  return (
    <div className="w-80 bg-white border-r border-gray-200 h-full overflow-y-auto">
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center space-x-2 mb-4">
          <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center">
            <MapPin className="w-5 h-5 text-white" />
          </div>
          <h1 className="text-xl font-bold text-gray-900">LivePeek</h1>
        </div>
        
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input 
            placeholder="Search locations..." 
            className="pl-10"
          />
        </div>
      </div>

      {/* Popular Destinations */}
      <div className="p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Popular Destinations</h2>
        <div className="space-y-3">
          {popularDestinations.map((destination) => (
            <Button
              key={destination.name}
              variant={selectedDestination === destination.name ? "default" : "ghost"}
              className="w-full justify-start h-auto p-3"
              onClick={() => onDestinationClick(destination.name)}
            >
              <div className="flex items-center space-x-3 w-full">
                <span className="text-lg">{destination.icon}</span>
                <div className="flex-1 text-left">
                  <p className="font-medium text-sm">{destination.name}</p>
                  <p className="text-xs text-gray-500">Trending: {destination.trending}</p>
                </div>
                <Badge variant="secondary" className="text-xs">
                  {destination.count}
                </Badge>
              </div>
            </Button>
          ))}
        </div>
        
        <Button variant="outline" className="w-full mt-4">
          Start Exploring
        </Button>
      </div>

      {/* Content Types */}
      <div className="p-6 border-t border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Content Types</h2>
        <div className="space-y-2">
          {contentTypes.map((type) => {
            const IconComponent = type.icon;
            return (
              <Button
                key={type.name}
                variant="ghost"
                className="w-full justify-start h-auto p-3"
              >
                <div className="flex items-center space-x-3 w-full">
                  <div className={`p-1.5 rounded-md ${type.color}`}>
                    <IconComponent className="w-4 h-4" />
                  </div>
                  <span className="flex-1 text-left text-sm font-medium">{type.name}</span>
                  <Badge variant="secondary" className="text-xs">
                    {type.count}
                  </Badge>
                </div>
              </Button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default Sidebar;

