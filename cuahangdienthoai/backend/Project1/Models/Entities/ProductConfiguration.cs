using System.ComponentModel.DataAnnotations;

namespace Project1.Models.Entities
{
    public class ProductConfiguration
    {
        [Key]
        public int ConfigID { get; set; }

        public string ConfigCode { get; set; }

        public int ProductID { get; set; }

        public string Color { get; set; }
        public string Screen { get; set; }
        public string OperatingSystem { get; set; }

        public string RearCamera { get; set; }
        public string FrontCamera { get; set; }

        public string CPU { get; set; }
        public string GPU { get; set; }

        public string RAM { get; set; }
        public string InternalStorage { get; set; }

        public string SIM { get; set; }
        public string Network { get; set; }

        public string Battery { get; set; }
        public string Charging { get; set; }

        public string RefreshRate { get; set; }

        public string Fingerprint { get; set; }
        public string WaterResistance { get; set; }

        public string Weight { get; set; }
        public string Design { get; set; }

        public DateTime CreatedAt { get; set; }
    }
}
