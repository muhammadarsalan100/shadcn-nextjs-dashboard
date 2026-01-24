"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ShoppingCart, Plus, Minus, Trash2, ArrowRight } from "lucide-react";

// Mock cart data - replace with actual cart data from API/state
type CartItem = {
  id: number;
  productId: number;
  name: string;
  description: string;
  size: string;
  image: string;
  originalPrice: number;
  discountedPrice: number;
  discountPercentage: number;
  quantity: number;
};

const mockCartItems: CartItem[] = [
  {
    id: 1,
    productId: 1,
    name: "perfume",
    description: "perfume",
    size: "50ml",
    image: "/placeholder-product.jpg",
    originalPrice: 23716.0,
    discountedPrice: 21344.4,
    discountPercentage: 10,
    quantity: 1,
  },
  {
    id: 2,
    productId: 2,
    name: "best perfume",
    description: "perfume 3",
    size: "100ml",
    image: "/placeholder-product.jpg",
    originalPrice: 18480.0,
    discountedPrice: 17186.4,
    discountPercentage: 7,
    quantity: 3,
  },
];

export default function CartPage() {
  const [cartItems, setCartItems] = useState<CartItem[]>(mockCartItems);

  const updateQuantity = (id: number, change: number) => {
    setCartItems((items) =>
      items.map((item) =>
        item.id === id
          ? { ...item, quantity: Math.max(1, item.quantity + change) }
          : item
      )
    );
  };

  const removeItem = (id: number) => {
    setCartItems((items) => items.filter((item) => item.id !== id));
  };

  const calculateTotal = () => {
    return cartItems.reduce(
      (sum, item) => sum + item.discountedPrice * item.quantity,
      0
    );
  };

  const calculateSubtotal = () => {
    return cartItems.reduce(
      (sum, item) => sum + item.originalPrice * item.quantity,
      0
    );
  };

  const calculateSavings = () => {
    return calculateSubtotal() - calculateTotal();
  };

  const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="space-y-6 p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <ShoppingCart className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">Shopping Cart</h1>
            <p className="text-muted-foreground">
              {totalItems} {totalItems === 1 ? "item" : "items"} in your cart
            </p>
          </div>
        </div>
      </div>

      {cartItems.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <ShoppingCart className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold mb-2">Your cart is empty</h3>
            <p className="text-muted-foreground mb-6">
              Start adding items to your cart
            </p>
            <Button>
              <ArrowRight className="h-4 w-4 mr-2" />
              Continue Shopping
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-4">
            {cartItems.map((item) => {
              const itemTotal = item.discountedPrice * item.quantity;
              const itemSavings =
                (item.originalPrice - item.discountedPrice) * item.quantity;

              return (
                <Card key={item.id} className="overflow-hidden">
                  <CardContent className="p-0">
                    <div className="flex gap-4 p-4">
                      {/* Product Image */}
                      <div className="relative w-20 h-20 sm:w-24 sm:h-24 flex-shrink-0 rounded-lg overflow-hidden bg-muted/50">
                        {item.discountPercentage > 0 && (
                          <Badge
                            variant="destructive"
                            className="absolute top-1 left-1 z-10 text-xs px-1.5 py-0"
                          >
                            -{item.discountPercentage}%
                          </Badge>
                        )}
                        <div className="w-full h-full flex items-center justify-center">
                          <ShoppingCart className="h-6 w-6 text-muted-foreground" />
                        </div>
                      </div>

                      {/* Product Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-lg mb-1 truncate">
                              {item.name}
                            </h3>
                            <p className="text-sm text-muted-foreground mb-3 truncate">
                              {item.description}
                            </p>

                            {/* Size and Pricing */}
                            <div className="flex items-center gap-3 mb-3">
                              <Badge
                                variant="outline"
                                className="bg-pink-50 text-pink-700 border-pink-200"
                              >
                                {item.size}
                              </Badge>
                              <div className="flex items-center gap-2">
                                <span className="text-base font-semibold text-foreground">
                                  PKR {itemTotal.toLocaleString("en-US", {
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2,
                                  })}
                                </span>
                                {item.discountPercentage > 0 && (
                                  <span className="text-xs text-muted-foreground line-through">
                                    PKR {(item.originalPrice * item.quantity).toLocaleString("en-US", {
                                      minimumFractionDigits: 2,
                                      maximumFractionDigits: 2,
                                    })}
                                  </span>
                                )}
                              </div>
                            </div>
                            {itemSavings > 0 && (
                              <p className="text-xs text-green-600 font-medium mb-2">
                                You save PKR {itemSavings.toLocaleString("en-US", {
                                  minimumFractionDigits: 2,
                                  maximumFractionDigits: 2,
                                })}
                              </p>
                            )}
                          </div>

                        </div>

                        {/* Quantity Controls */}
                        <div className="flex items-center justify-between mt-4 pt-4 border-t">
                          <div className="flex items-center gap-2 border rounded-md">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 rounded-r-none hover:bg-muted"
                              onClick={() => updateQuantity(item.id, -1)}
                              disabled={item.quantity <= 1}
                            >
                              <Minus className="h-3.5 w-3.5" />
                            </Button>
                            <span className="px-3 py-1 min-w-[2.5rem] text-center text-sm font-medium">
                              {item.quantity}
                            </span>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 rounded-l-none hover:bg-muted"
                              onClick={() => updateQuantity(item.id, 1)}
                            >
                              <Plus className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeItem(item.id)}
                            className="text-muted-foreground hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4 mr-1" />
                            Remove
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <Card className="sticky top-6">
              <CardHeader>
                <CardTitle>Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span>
                      PKR {calculateSubtotal().toLocaleString("en-US", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </span>
                  </div>
                  {calculateSavings() > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-green-600">Savings</span>
                      <span className="text-green-600 font-medium">
                        -PKR {calculateSavings().toLocaleString("en-US", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </span>
                    </div>
                  )}
                  <Separator />
                  <div className="flex justify-between font-semibold text-lg">
                    <span>Total</span>
                    <span className="text-primary">
                      PKR {calculateTotal().toLocaleString("en-US", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </span>
                  </div>
                </div>

                <Button className="w-full" size="lg">
                  Proceed to Checkout
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>

                <Button variant="outline" className="w-full" size="lg">
                  Continue Shopping
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
