"use client";

import { useEffect, useState } from "react";

import { MARKET_ALL } from "@/constants";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useRouter } from "next/navigation";
import { millionNumbers, numberCommas } from "@/utils/coins";

export type Root = {
  type: string;
  code: string;
  opening_price: number;
  high_price: number;
  low_price: number;
  trade_price: number;
  prev_closing_price: number;
  acc_trade_price: number;
  change: "RISE" | "EVEN" | "FALL";
  change_price: number;
  signed_change_price: number;
  change_rate: number;
  signed_change_rate: number;
  ask_bid: "ASK" | "BID";
  trade_volume: number;
  acc_trade_volume: number;
  trade_date: string;
  trade_time: string;
  trade_timestamp: number;
  acc_ask_volume: number;
  acc_bid_volume: number;
  highest_52_week_price: number;
  highest_52_week_date: string;
  lowest_52_week_price: number;
  lowest_52_week_date: string;
  market_state: string;
  is_trading_suspended: boolean;
  delisting_date: any;
  market_warning: string;
  timestamp: number;
  acc_trade_price_24h: number;
  acc_trade_volume_24h: number;
  stream_type: string;
} & { updated: "up" | "down" | "none" };

const krwMarkets = MARKET_ALL.filter((item) =>
  item.market.startsWith("KRW"),
).map((item) => item.market);

export const getNameByMarket = (market: string) => {
  const foundMarket = MARKET_ALL.find((item) => item.market === market);
  return foundMarket ? foundMarket.korean_name : null;
};

export default function CoinList() {
  const [messages, setMessages] = useState<Root[]>([]);

  const router = useRouter();

  useEffect(() => {
    const ws = new WebSocket("wss://api.upbit.com/websocket/v1");

    ws.onopen = () => {
      console.log("connected");

      ws.send(
        JSON.stringify([
          { ticket: "test" },
          {
            type: "ticker",
            codes: krwMarkets,
          },
        ]),
      );
    };

    ws.onmessage = async (event) => {
      const text = await event.data.text();
      const data = JSON.parse(text);
      setMessages((prev) => {
        const filtered = prev.filter((item) => item.code !== data.code);
        const sortyBy = (item: Root) => {
          return item.acc_trade_price_24h;
        };
        const dataIsUpdated = {
          ...data,
          updated:
            data.ask_bid === "BID"
              ? "up"
              : data.ask_bid === "ASK"
                ? "down"
                : "none",
        };
        const sorted = [...filtered, dataIsUpdated].sort(
          (a, b) => sortyBy(b) - sortyBy(a),
        );

        sorted.forEach((item) => {
          if (item.code === data.code) {
            setTimeout(() => {
              setMessages((prev) =>
                prev.map((m) =>
                  m.code === data.code ? { ...m, updated: "none" } : m,
                ),
              );
            }, 500);
          }
        });

        return sorted;
      });
    };

    ws.onclose = () => {
      console.log("disconnected");
    };

    return () => {
      ws.close();
    };
  }, []);

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-1/5">한글명</TableHead>
          <TableHead className="w-1/4 text-right">현재가</TableHead>
          <TableHead className="w-1/4 text-right">전일대비</TableHead>
          <TableHead className="w-1/5 text-right">거래대금</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {messages.map((m, i) => {
          return (
            <a key={i} href={`/coins/${m.code}`} className="contents">
              <TableRow className="h-20">
                <TableCell>
                  {getNameByMarket(m.code)} <br /> {m.code}
                </TableCell>
                <TableCell
                  className={`text-right ${m.change === "RISE" ? "text-red-600" : m.change === "FALL" ? "text-blue-600" : ""}`}
                >
                  {numberCommas(m.trade_price)}
                </TableCell>
                <TableCell>
                  <div className="flex justify-end w-full">
                    <div
                      className={`flex flex-col text-right p-1 w-24 border border-transparent
                    ${m.updated === "up" ? "animate-price-up" : m.updated === "down" ? "animate-price-down" : ""}
                    ${m.change === "RISE" ? "text-red-600" : m.change === "FALL" ? "text-blue-600" : ""}`}
                    >
                      <span>{(m.signed_change_rate * 100).toFixed(2)}%</span>
                      <span>
                        {m.signed_change_price > 0
                          ? "+" + numberCommas(m.signed_change_price)
                          : numberCommas(m.signed_change_price)}
                      </span>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  {millionNumbers(m.acc_trade_price_24h)}
                </TableCell>
              </TableRow>
            </a>
          );
        })}
      </TableBody>
    </Table>
  );
}
