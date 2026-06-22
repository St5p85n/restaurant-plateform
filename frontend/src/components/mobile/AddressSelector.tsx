import React, { useEffect, useState } from 'react';
import { supabase } from '@/db/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MapPin, Plus, Check } from 'lucide-react';
import { toast } from 'sonner';

interface DeliveryAddress {
  id: string;
  full_name: string;
  phone: string;
  address_line1: string;
  address_line2?: string;
  city: string;
  postal_code?: string;
  is_default: boolean;
}

interface AddressSelectorProps {
  selectedAddressId?: string;
  onSelectAddress: (address: DeliveryAddress) => void;
  onAddNew: () => void;
}

export default function AddressSelector({
  selectedAddressId,
  onSelectAddress,
  onAddNew,
}: AddressSelectorProps) {
  const { profile } = useAuth();
  const [addresses, setAddresses] = useState<DeliveryAddress[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (profile) {
      loadAddresses();
    }
  }, [profile]);

  const loadAddresses = async () => {
    try {
      setLoading(true);

      // Récupérer le customer_id
      const { data: customerData, error: customerError } = await supabase
        .from('customers')
        .select('id')
        .eq('profile_id', profile?.id)
        .single();

      if (customerError) throw customerError;

      // Récupérer les adresses
      const { data, error } = await supabase
        .from('delivery_addresses')
        .select('*')
        .eq('customer_id', customerData.id)
        .order('is_default', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAddresses(data || []);

      // Sélectionner automatiquement l'adresse par défaut si aucune n'est sélectionnée
      if (!selectedAddressId && data && data.length > 0) {
        const defaultAddress = data.find((addr) => addr.is_default) || data[0];
        onSelectAddress(defaultAddress);
      }
    } catch (error: any) {
      toast.error(`Erreur: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Adresse de livraison</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-4">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Adresse de livraison</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {addresses.length === 0 ? (
          <div className="text-center py-4 space-y-3">
            <p className="text-sm text-muted-foreground">
              Aucune adresse enregistrée
            </p>
            <Button size="sm" onClick={onAddNew}>
              <Plus className="mr-2 h-4 w-4" />
              Ajouter une adresse
            </Button>
          </div>
        ) : (
          <>
            <div className="space-y-2">
              {addresses.map((address) => {
                const isSelected = address.id === selectedAddressId;
                return (
                  <button
                    key={address.id}
                    onClick={() => onSelectAddress(address)}
                    className={`w-full text-left p-3 rounded-lg border transition-all ${
                      isSelected
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-primary/50'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 border-primary mt-0.5">
                        {isSelected && (
                          <Check className="h-3 w-3 text-primary" />
                        )}
                      </div>
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-sm">
                            {address.full_name}
                          </p>
                          {address.is_default && (
                            <Badge variant="secondary" className="text-xs">
                              Par défaut
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-start gap-1 text-xs text-muted-foreground">
                          <MapPin className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                          <span>
                            {address.address_line1}
                            {address.address_line2 && `, ${address.address_line2}`}
                            , {address.city}
                            {address.postal_code && ` ${address.postal_code}`}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {address.phone}
                        </p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={onAddNew}
            >
              <Plus className="mr-2 h-4 w-4" />
              Ajouter une nouvelle adresse
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
}
