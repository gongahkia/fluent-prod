import { AlertTriangle, User, Star, Bookmark } from "lucide-react";
import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

const GuestWarning = ({ open, onContinue, onCancel }) => {
  return (
    <Dialog open={open} onOpenChange={onCancel}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex justify-center mb-4">
            <AlertTriangle className="w-12 h-12 text-yellow-500" />
          </div>
          <DialogTitle className="text-center text-2xl font-bold">
            Continue as Guest?
          </DialogTitle>
          <DialogDescription className="text-center text-gray-600 mt-2">
            You can explore the app as a guest, but your experience will be limited.
          </DialogDescription>
        </DialogHeader>

        <div className="my-6 space-y-4 text-gray-700">
          <div className="flex items-start">
            <User className="w-5 h-5 mr-3 mt-1 text-orange-500 flex-shrink-0" />
            <p>
              <span className="font-semibold">No Profile:</span> You won't have an
              account to save your progress or preferences.
            </p>
          </div>
          <div className="flex items-start">
            <Star className="w-5 h-5 mr-3 mt-1 text-orange-500 flex-shrink-0" />
            <p>
              <span className="font-semibold">No Personalization:</span> Your
              feed and recommendations won't be tailored to you.
            </p>
          </div>
          <div className="flex items-start">
            <Bookmark className="w-5 h-5 mr-3 mt-1 text-orange-500 flex-shrink-0" />
            <p>
              <span className="font-semibold">No Saving:</span> You won't be able
              to save words to your dictionary or save posts.
            </p>
          </div>
        </div>

        <DialogFooter className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <Button
            variant="outline"
            onClick={onCancel}
            className="w-full"
          >
            Cancel
          </Button>
          <Button
            onClick={onContinue}
            className="w-full bg-orange-600 hover:bg-orange-700 text-white"
          >
            I Understand, Continue
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default GuestWarning;
