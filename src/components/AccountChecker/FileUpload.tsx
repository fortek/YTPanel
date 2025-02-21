
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

export const FileUpload = () => {
  const [file, setFile] = useState<File | null>(null);
  const [serviceType, setServiceType] = useState<"youtube" | "vk">("youtube");
  const { toast } = useToast();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      toast({
        title: "Error",
        description: "Please select a file first",
        variant: "destructive",
      });
      return;
    }

    const formData = new FormData();
    formData.append("file", file);
    formData.append("serviceType", serviceType);

    try {
      const response = await fetch("/api/lists", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) throw new Error("Upload failed");

      toast({
        title: "Success",
        description: "File uploaded successfully",
      });
      setFile(null);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to upload file",
        variant: "destructive",
      });
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Upload Accounts</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Select value={serviceType} onValueChange={(value: "youtube" | "vk") => setServiceType(value)}>
          <SelectTrigger>
            <SelectValue placeholder="Select service type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="youtube">YouTube</SelectItem>
            <SelectItem value="vk">VK</SelectItem>
          </SelectContent>
        </Select>
        
        <div className="space-y-2">
          <Input
            type="file"
            accept=".txt"
            onChange={handleFileChange}
            className="cursor-pointer"
          />
          <p className="text-sm text-gray-500">
            {serviceType === "vk" 
              ? "Upload a text file with VK accounts in login:password format"
              : "Upload a text file with YouTube cookies"
            }
          </p>
        </div>
        
        <Button 
          onClick={handleUpload}
          className="w-full"
          disabled={!file}
        >
          Upload {serviceType === "vk" ? "VK" : "YouTube"} Accounts
        </Button>
      </CardContent>
    </Card>
  );
};
