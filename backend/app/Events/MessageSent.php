<?php

namespace App\Events;

use App\Models\Customer;
use App\Models\Interaction;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class MessageSent implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public Interaction $interaction;

    public Customer $customer;

    /**
     * Create a new event instance.
     */
    public function __construct(Interaction $interaction, Customer $customer)
    {
        $this->interaction = $interaction;
        $this->customer = $customer;
    }

    /**
     * Get the channels the event should broadcast on.
     *
     * @return array<int, Channel>
     */
    public function broadcastOn(): array
    {
        return [
            new PrivateChannel('fanpage.'.$this->interaction->fanpage_id),
        ];
    }

    /**
     * Get the data to broadcast.
     *
     * @return array<string, mixed>
     */
    public function broadcastWith(): array
    {
        return [
            'interaction' => $this->interaction->toArray(),
            'customer' => $this->customer->toArray(),
        ];
    }
}
