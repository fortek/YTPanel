
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";

interface Account {
  id: string;
  login?: string;
  password?: string;
  cookies?: string;
  status: "pending" | "valid" | "invalid";
  serviceType: "youtube" | "vk";
}

interface AccountsListProps {
  accounts: Account[];
  onCheckAccount: (accountId: string) => Promise<void>;
  onCheckAll: () => Promise<void>;
  title: string;
  serviceType: "youtube" | "vk";
}

export const AccountsList = ({ 
  accounts, 
  onCheckAccount, 
  onCheckAll, 
  title,
  serviceType 
}: AccountsListProps) => {
  const [checking, setChecking] = useState<string[]>([]);

  const handleCheck = async (accountId: string) => {
    setChecking(prev => [...prev, accountId]);
    await onCheckAccount(accountId);
    setChecking(prev => prev.filter(id => id !== accountId));
  };

  const handleCheckAll = async () => {
    await onCheckAll();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "valid": return "bg-green-500";
      case "invalid": return "bg-red-500";
      default: return "bg-yellow-500";
    }
  };

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>{title}</CardTitle>
        <Button onClick={handleCheckAll}>Check All</Button>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[500px] pr-4">
          <div className="space-y-4">
            {accounts.map((account) => (
              <div key={account.id}>
                <div className="flex items-center justify-between py-2">
                  <div className="flex flex-col gap-1">
                    {serviceType === "vk" ? (
                      <>
                        <span className="text-sm font-medium">Login: {account.login}</span>
                        <span className="text-sm text-gray-500">Password: {account.password}</span>
                      </>
                    ) : (
                      <span className="text-sm font-medium">Cookies: {account.cookies?.substring(0, 30)}...</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className={getStatusColor(account.status)}>
                      {account.status}
                    </Badge>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleCheck(account.id)}
                      disabled={checking.includes(account.id)}
                    >
                      {checking.includes(account.id) ? "Checking..." : "Check"}
                    </Button>
                  </div>
                </div>
                <Separator />
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};
