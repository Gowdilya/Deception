using System;
using System.Collections.Concurrent;
using System.Collections.Generic;
using System.Linq;

namespace DeceptionApi.Services;

public class Room
{
    public string Code { get; set; } = string.Empty;
    public List<string> Players { get; set; } = new();
    public bool IsStarted { get; set; }
}

public class RoomService
{
    private readonly ConcurrentDictionary<string, Room> _rooms = new();

    public Room? GetRoom(string code)
    {
        _rooms.TryGetValue(code, out var room);
        if (room == null) return null;
        // Return a snapshot copy to avoid callers mutating internal state and to provide a consistent view.
        return new Room
        {
            Code = room.Code,
            Players = room.Players.ToList(),
            IsStarted = room.IsStarted
        };
    }

    public string CreateRoom(string hostName)
    {
        var code = Guid.NewGuid().ToString("N").Substring(0, 6).ToUpper();
        var room = new Room
        {
            Code = code,
            Players = new List<string> { hostName }
        };
        _rooms.TryAdd(code, room);
        return code;
    }

    public bool JoinRoom(string code, string playerName)
    {
        var room = GetRoom(code);
        if (room == null) return false;
        // Use the internal dictionary's room instance for modification so changes persist.
        if (!_rooms.TryGetValue(code, out var internalRoom)) return false;

        lock (internalRoom)
        {
            if (!internalRoom.Players.Contains(playerName))
            {
                internalRoom.Players.Add(playerName);
            }
        }
        return true;
    }

    public bool StartGame(string code)
    {
        var room = GetRoom(code);
        if (room == null) return false;

        lock (room.Players)
        {
            if (room.Players.Count < 4 || room.IsStarted) return false;
            room.IsStarted = true;
            return true;
        }
    }
}