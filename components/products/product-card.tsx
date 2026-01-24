"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ShoppingCart, Star } from "lucide-react";
import { Product } from "@/app/services/products";

interface ProductCardProps {
  product: Product;
  onAddToCart?: (product: Product) => void;
}

export function ProductCard({ product, onAddToCart }: ProductCardProps) {
  const discount = Number(product.discountPercentage) || 0;
  const originalPrice = parseFloat(product.price.replace(/[^0-9.]/g, ""));
  const discountedPrice = discount > 0 
    ? originalPrice * (1 - discount / 100) 
    : originalPrice;
  const savings = discount > 0 ? originalPrice - discountedPrice : 0;
  const isOutOfStock = !product.inStock;

  return (
    <Card className="group overflow-hidden hover:shadow-lg transition-all duration-300">
      {/* Product Image Section */}
      <div className="relative aspect-square bg-gradient-to-br from-amber-50 to-pink-50 overflow-hidden">
        {/* Out of Stock Overlay */}
        {isOutOfStock && (
          <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/30">
            <Badge 
              variant="destructive" 
              className="text-sm font-semibold px-4 py-2"
            >
              Out of Stock
            </Badge>
          </div>
        )}
        
        {/* Product Image - Blurred when out of stock */}
        {product.thumbnailUrl ? (
          <div className="relative w-full h-full">
            <img
              src={product.thumbnailUrl}
              alt={product.title || "Product"}
              className={`w-full h-full object-cover transition-all duration-300 ${
                isOutOfStock ? "blur-md opacity-50" : "group-hover:scale-105"
              }`}
            />
          </div>
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <ShoppingCart className="h-16 w-16 text-muted-foreground/30" />
          </div>
        )}

        {/* Discount Badge */}
        {discount > 0 && (
          <Badge
            variant="destructive"
            className="absolute top-3 left-3 z-10 font-semibold"
          >
            -{discount}%
          </Badge>
        )}
      </div>

      {/* Product Details Section */}
      <CardContent className="p-4 space-y-3">
        {/* Premium Badge */}
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-red-500" />
          <span className="text-xs font-medium text-muted-foreground">
            PREMIUM
          </span>
        </div>

        {/* Product Name */}
        <h3 className="font-bold text-lg line-clamp-1">
          {product.title || "Product"}
        </h3>

        {/* Rating */}
        <div className="flex items-center gap-2">
          <div className="flex items-center">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                className={`h-4 w-4 ${
                  star <= 4
                    ? "fill-yellow-400 text-yellow-400"
                    : star === 5
                    ? "fill-yellow-200 text-yellow-400"
                    : "fill-gray-200 text-gray-300"
                }`}
              />
            ))}
          </div>
          <span className="font-semibold text-sm">4.5</span>
          <span className="text-xs text-muted-foreground">(0)</span>
        </div>

        {/* Pricing */}
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-2xl font-bold">
              ${discountedPrice.toFixed(2)}
            </span>
            {discount > 0 && (
              <>
                <span className="text-sm text-muted-foreground line-through">
                  ${originalPrice.toFixed(2)}
                </span>
                <Badge
                  variant="destructive"
                  className="text-xs px-1.5 py-0"
                >
                  -{discount}%
                </Badge>
              </>
            )}
          </div>
          {savings > 0 && (
            <p className="text-sm font-medium text-green-600">
              Save ${savings.toFixed(2)}
            </p>
          )}
        </div>

        {/* Free Shipping */}
        <p className="text-xs font-medium text-red-600">FREE SHIPPING</p>

        {/* Add to Cart Button */}
        <Button
          className="w-full bg-amber-700 hover:bg-amber-800 text-white"
          disabled={isOutOfStock}
          onClick={() => onAddToCart?.(product)}
        >
          <ShoppingCart className="h-4 w-4 mr-2" />
          {isOutOfStock ? "Out of Stock" : "Add to Cart"}
        </Button>
      </CardContent>
    </Card>
  );
}
