import React from 'react';
import { TrendingUp, Video, Users, ShoppingBag, Calendar, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

const contentTypes = [
  { 
    name: "Trending News", 
    icon: TrendingUp, 
    count: 24, 
    color: "bg-red-500",
    description: "Latest breaking news and trending stories"
  },
  { 
    name: "Local Videos", 
    icon: Video, 
    count: 156, 
    color: "bg-green-500",
    description: "Popular videos from local creators"
  },
  { 
    name: "Social Content", 
    icon: Users, 
    count: 89, 
    color: "bg-orange-500",
    description: "Trending social media posts and discussions"
  },
  { 
    name: "Commerce", 
    icon: ShoppingBag, 
    count: 45, 
    color: "bg-purple-500",
    description: "Local deals and shopping trends"
  },
  { 
    name: "Cultural Events", 
    icon: Calendar, 
    count: 78, 
    color: "bg-blue-500",
    description: "Festivals, concerts, and cultural happenings"
  },
  { 
    name: "Language Exchange", 
    icon: MessageCircle, 
    count: 12, 
    color: "bg-pink-500",
    description: "Connect with locals for language practice"
  }
];

const ContentTypesSidebar = ({ selectedContentType, onContentTypeSelect }) => {
  return (
    <div className="w-80 bg-white border-l border-gray-200 h-full overflow-y-auto">
      <div className="p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-6">Content Types</h2>
        
        <div className="space-y-4">
          {contentTypes.map((type) => {
            const IconComponent = type.icon;
            const isSelected = selectedContentType === type.name;
            
            return (
              <div
                key={type.name}
                className={`p-4 rounded-lg border-2 cursor-pointer transition-all duration-200 ${
                  isSelected 
                    ? 'border-orange-500 bg-orange-50' 
                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                }`}
                onClick={() => onContentTypeSelect(type.name)}
              >
                <div className="flex items-start space-x-3">
                  <div className={`p-2 rounded-lg ${type.color} bg-opacity-10`}>
                    <IconComponent className={`w-5 h-5 ${type.color.replace('bg-', 'text-')}`} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="font-medium text-gray-900">{type.name}</h3>
                      <Badge 
                        variant={isSelected ? "default" : "secondary"} 
                        className="text-xs"
                      >
                        {type.count}
                      </Badge>
                    </div>
                    <p className="text-xs text-gray-500">{type.description}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        
        <div className="mt-8 p-4 bg-gradient-to-r from-orange-50 to-pink-50 rounded-lg border border-orange-200">
          <h3 className="font-medium text-gray-900 mb-2">Discover More</h3>
          <p className="text-sm text-gray-600 mb-3">
            Explore authentic cultural content from around the world
          </p>
          <Button size="sm" className="w-full">
            Upgrade to Premium
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ContentTypesSidebar;

