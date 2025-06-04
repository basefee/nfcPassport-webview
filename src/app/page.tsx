"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { useAppKit } from "@reown/appkit/react";
import { useAccount, useDisconnect } from "wagmi";
import {
  IExecDataProtector,
  IExecDataProtectorCore,
} from "@iexec/dataprotector";
import { Input } from "@/components/ui/input";
import { EIP1193Provider } from "viem";

export default function Home() {
  const { open } = useAppKit();
  const { disconnectAsync } = useDisconnect();
  const { isConnected, connector } = useAccount();

  const [dataProtectorCore, setDataProtectorCore] =
    useState<IExecDataProtectorCore | null>(null);
  const [dataToProtect, setDataToProtect] = useState("");

  const login = () => {
    open({ view: "Connect" });
  };

  const logout = async () => {
    try {
      await disconnectAsync();
    } catch (err) {
      console.error("Failed to logout:", err);
    }
  };

  useEffect(() => {
    const initializeDataProtector = async () => {
      if (isConnected && connector) {
        const provider = await connector.getProvider();
        const dataProtector = new IExecDataProtector(provider as EIP1193Provider);
        setDataProtectorCore(dataProtector.core);
      }
    };

    initializeDataProtector();
  }, [isConnected, connector]);

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      try {
        const data = typeof event.data === "string" ? JSON.parse(event.data) : event.data;

        if (data?.mrz && data?.timestamp) {
          // You can customize what you want to use as `dataToProtect`
          const formatted = `MRZ: ${data.mrz} | Timestamp: ${data.timestamp}`;
          setDataToProtect(formatted);
        }
      } catch (error) {
        console.warn("Ignored invalid message:", error);
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, []);


  const protectData = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (dataProtectorCore) {
      try {
        const protectedData = await dataProtectorCore.protectData({
          data: {
            email: dataToProtect,
          },
        });
        console.log("Protected Data:", protectedData);
      } catch (error) {
        console.error("Error protecting data:", error);
      }
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <nav className="bg-neutral-100">
        <div className="max-w-4xl mx-auto flex justify-between items-center p-2">
          <div className="ml-3 font-mono leading-5 font-bold">
            iExec starter front
          </div>
          {!isConnected ? (
            <Button onClick={login} variant={"default"}>
              Connect my wallet
            </Button>
          ) : (
            <Button onClick={logout} variant={"default"}>
              Logout
            </Button>
          )}
        </div>
      </nav>
      <section className="p-2 pt-8">
        {isConnected ? (
          <form onSubmit={protectData} className="p-2 space-y-2">
            <div className="space-y-1">
              <label htmlFor="nfc_data">NFC Data Received</label>
              <Input
                id="nfc_data"
                value={dataToProtect}
                readOnly
                placeholder="Waiting for NFC data from React Native..."
              />
            </div>

            <Button disabled={!dataToProtect} type="submit">
              Protect my data
            </Button>
          </form>
        ) : (
          <p>Please connect your wallet</p>
        )}
      </section>
    </div>
  );
}
